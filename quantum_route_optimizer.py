"""
Quantum-Inspired Route Optimization Module for PranAIR Medical Drone
====================================================================
Uses QUBO (Quadratic Unconstrained Binary Optimization) formulation
to solve the Traveling Salesman Problem for optimal medical delivery routes.

Architecture:
- Qiskit Optimization for QUBO formulation
- Classical solver (NumPy) for stability
- Easily upgradeable to real quantum hardware (QAOA, D-Wave)
"""

import logging
import numpy as np
import networkx as nx
from typing import List, Optional
from pydantic import BaseModel

# Quantum Optimization imports
OPTIMIZER_AVAILABLE = True
try:
    from qiskit_optimization.applications import Tsp
    from qiskit_optimization.converters import QuadraticProgramToQubo
    from qiskit_algorithms import NumPyMinimumEigensolver
    from qiskit_optimization.algorithms import MinimumEigenOptimizer
except ImportError as e:
    OPTIMIZER_AVAILABLE = False
    logging.warning(f"Qiskit optimization not available: {e}")

# Setup logging
logger = logging.getLogger("QuantumOptimizer")

# ============================================================================
# DATA MODELS
# ============================================================================

class Location(BaseModel):
    """Geographic location with optional identifier"""
    lat: float
    lng: float
    id: Optional[str] = "target"

class RouteRequest(BaseModel):
    """Request for route optimization"""
    current_location: Location
    targets: List[Location]

class OptimizedRoute(BaseModel):
    """Optimized route response"""
    status: str
    optimization_engine: str
    calculation_time_sec: float
    optimized_route: List[dict]
    waypoint_count: int

# ============================================================================
# DISTANCE CALCULATION
# ============================================================================

def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth.
    Returns distance in kilometers.
    """
    from math import radians, cos, sin, asin, sqrt
    
    # Convert to radians
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
    c = 2 * asin(sqrt(a))
    
    # Earth radius in km
    r = 6371
    
    return c * r

def build_distance_matrix(locations: List[Location], use_haversine: bool = True) -> np.ndarray:
    """
    Build distance matrix for all locations.
    
    Args:
        locations: List of Location objects
        use_haversine: If True, use Haversine formula for accurate distances
    
    Returns:
        NxN numpy array of distances
    """
    num_nodes = len(locations)
    adj_matrix = np.zeros((num_nodes, num_nodes))
    
    for i in range(num_nodes):
        for j in range(num_nodes):
            if i == j:
                continue
            
            if use_haversine:
                dist = haversine_distance(
                    locations[i].lat, locations[i].lng,
                    locations[j].lat, locations[j].lng
                )
            else:
                # Euclidean approximation (faster but less accurate)
                dist = np.linalg.norm(
                    np.array([locations[i].lat, locations[i].lng]) - 
                    np.array([locations[j].lat, locations[j].lng])
                )
            
            adj_matrix[i][j] = dist
    
    return adj_matrix

# ============================================================================
# QUBO OPTIMIZATION ENGINE
# ============================================================================

def solve_tsp_qubo(start: Location, targets: List[Location]) -> List[dict]:
    """
    Solves the Traveling Salesperson Problem using QUBO formulation.
    
    Current Implementation: Classical Exact Solver (NumPy) for stability
    Future Upgrade Path: Replace with QAOA or D-Wave Sampler for real quantum
    
    Args:
        start: Current drone location
        targets: List of delivery target locations
    
    Returns:
        Optimized path as list of waypoint dictionaries
    """
    if not OPTIMIZER_AVAILABLE:
        logger.warning("Optimization libraries not found. Returning sequential order.")
        return _fallback_sequential_route(start, targets)

    if len(targets) == 0:
        return [{"lat": start.lat, "lng": start.lng, "id": start.id, "sequence_order": 0}]
    
    logger.info(f"Starting QUBO optimization for {len(targets)} targets...")
    
    try:
        # 1. Prepare all locations [Start, Target1, Target2, ...]
        all_points = [start] + targets
        num_nodes = len(all_points)
        
        # 2. Build distance matrix using Haversine for accuracy
        adj_matrix = build_distance_matrix(all_points, use_haversine=True)
        logger.info(f"Distance matrix shape: {adj_matrix.shape}")
        
        # 3. Create TSP problem instance using NetworkX graph
        graph = nx.from_numpy_array(adj_matrix)
        tsp_prob = Tsp(graph)
        qp = tsp_prob.to_quadratic_program()
        
        # 4. Convert to QUBO (Quadratic Unconstrained Binary Optimization)
        qubo_converter = QuadraticProgramToQubo()
        qubo = qubo_converter.convert(qp)
        
        # 5. Solve using Classical Simulator
        # NOTE: For real quantum hardware, replace with:
        #   - QAOA (Quantum Approximate Optimization Algorithm)
        #   - VQE (Variational Quantum Eigensolver)
        #   - D-Wave Sampler (for quantum annealing)
        solver = MinimumEigenOptimizer(NumPyMinimumEigensolver())
        result = solver.solve(qubo)
        
        # 6. Interpret solution
        order_indices = tsp_prob.interpret(result)
        logger.info(f"Raw solution order: {order_indices}")
        
        # 7. Ensure route starts at current location (index 0)
        start_index_in_solution = list(order_indices).index(0)
        rotated_indices = np.roll(order_indices, -start_index_in_solution)
        
        # 8. Build optimized path
        optimized_path = []
        for seq_num, idx in enumerate(rotated_indices):
            point = all_points[idx]
            optimized_path.append({
                "lat": point.lat,
                "lng": point.lng,
                "id": point.id if hasattr(point, 'id') else f"waypoint_{seq_num}",
                "sequence_order": seq_num
            })
        
        total_distance = result.fval
        logger.info(f"✅ Optimization complete. Total path distance: {total_distance:.2f} km")
        
        return optimized_path
        
    except Exception as e:
        logger.error(f"QUBO optimization failed: {e}")
        logger.warning("Falling back to sequential route")
        return _fallback_sequential_route(start, targets)

def _fallback_sequential_route(start: Location, targets: List[Location]) -> List[dict]:
    """
    Fallback method: Returns sequential route without optimization.
    Used when QUBO solver is unavailable.
    """
    path = [{"lat": start.lat, "lng": start.lng, "id": start.id, "sequence_order": 0}]
    
    for i, target in enumerate(targets):
        path.append({
            "lat": target.lat,
            "lng": target.lng,
            "id": target.id if hasattr(target, 'id') else f"target_{i}",
            "sequence_order": i + 1
        })
    
    return path

# ============================================================================
# ROUTE METRICS
# ============================================================================

def calculate_route_metrics(route: List[dict]) -> dict:
    """
    Calculate metrics for a given route.
    
    Returns:
        Dictionary with total_distance, avg_segment_length, etc.
    """
    if len(route) < 2:
        return {"total_distance_km": 0, "segments": 0}
    
    total_distance = 0
    for i in range(len(route) - 1):
        dist = haversine_distance(
            route[i]["lat"], route[i]["lng"],
            route[i+1]["lat"], route[i+1]["lng"]
        )
        total_distance += dist
    
    return {
        "total_distance_km": round(total_distance, 2),
        "segments": len(route) - 1,
        "avg_segment_km": round(total_distance / (len(route) - 1), 2)
    }

# ============================================================================
# QUANTUM UPGRADE PATH (Future)
# ============================================================================

def solve_tsp_qaoa(start: Location, targets: List[Location]):
    """
    PLACEHOLDER: Future implementation using QAOA on real quantum hardware.
    
    To implement:
    1. from qiskit_algorithms import QAOA
    2. from qiskit.primitives import Sampler
    3. Configure quantum backend (IBM Quantum, AWS Braket, etc.)
    """
    raise NotImplementedError("QAOA solver not yet implemented. Use solve_tsp_qubo() instead.")

def solve_tsp_dwave(start: Location, targets: List[Location]):
    """
    PLACEHOLDER: Future implementation using D-Wave quantum annealer.
    
    To implement:
    1. from dwave.system import DWaveSampler, EmbeddingComposite
    2. Convert QUBO to D-Wave format
    3. Sample from quantum annealer
    """
    raise NotImplementedError("D-Wave solver not yet implemented. Use solve_tsp_qubo() instead.")
