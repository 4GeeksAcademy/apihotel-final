import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const CrearRoom = () => {
    const [branchId, setBranchId] = useState("");
    const [branches, setBranches] = useState([]);
    const [nombre, setNombre] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const isMounted = useRef(true);

    const getBackendUrl = () => {
        const baseUrl = process.env.BACKEND_URL;
        if (!baseUrl) {
            console.error("Error: BACKEND_URL no está definido.");
            setError("Error interno: No se ha configurado la URL del servidor.");
            return null;
        }
        return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    };

    useEffect(() => {
        const token = localStorage.getItem("token"); 
        console.log("Token enviado", token);

        fetch(process.env.BACKEND_URL + "/api/branches", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            }
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener branches");
            }
            return response.json();
        })
        .then((data) => {
            if (isMounted.current) setBranches(data);
        })
        .catch((error) => {
            console.error("Error cargando branches:", error);
            setError("No se pudieron cargar las sucursales.");
        });

        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        const apiUrl = getBackendUrl();
        if (!apiUrl || !token) return;

        const nombreTrim = nombre.trim();
        if (!nombreTrim) {
            setError("El nombre de la habitación es obligatorio.");
            return;
        }

        setCargando(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}api/rooms`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    nombre: nombreTrim,
                    branchId: Number(branchId)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al crear la habitación.");
            }

            const data = await response.json();
            console.log("Habitación creada:", data);
            setNombre("");
            alert("Habitación creada exitosamente.");
            navigate("/listaRooms");
        } catch (error) {
            console.error("Error al crear la habitación:", error);
            setError(error.message || "Error desconocido al crear la habitación.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
            <div className="card p-4" style={{ width: "300px" }}>
                <h1 className="text-center mb-4">Crear Habitación</h1>
                {error && <div className="alert alert-danger text-center">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="form-control"
                            placeholder="Nombre de la habitación"
                            required
                            disabled={cargando}
                        />
                        <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="form-control mb-3"
                            required
                        >
                            <option value="">Seleccionar Branch</option>
                            {branches.length > 0 ? (
                                branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.nombre}
                                    </option>
                                ))
                            ) : (
                                <option disabled>Cargando branches...</option>
                            )}
                        </select>
                        <button type="submit" className="btn w-100" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}>
                            Crear Room
                        </button>
                    </div>
                </form>
                <div className="d-flex justify-content-center align-items-center mt-4">
                    <button className="btn" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }} onClick={() => navigate("/listaRooms")}>
                        Volver
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrearRoom;
