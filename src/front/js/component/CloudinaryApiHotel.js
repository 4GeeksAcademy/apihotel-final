import React, { useState } from "react";

const CloudinaryApiHotel = ({ setImageUrl, setErrorMessage }) => {
  const [localErrorMessage, setLocalErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      const msg = "Solo se permiten archivos de imagen.";
      setLocalErrorMessage(msg);
      setErrorMessage(msg);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Apihotel");
    formData.append("api_key", "616247578316739");
    formData.append("timestamp", Date.now() / 1000);

    setUploading(true);
    setLocalErrorMessage("");
    setErrorMessage("");
    setPreview(URL.createObjectURL(file));

    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/dxkiklgd2/image/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.secure_url) {
        setImageUrl(data.secure_url); // 👈 se pasa al componente padre
      } else {
        const msg = "No se pudo obtener la URL de la imagen.";
        setLocalErrorMessage(msg);
        setErrorMessage(msg);
      }
    } catch (error) {
      const msg = "Error al subir la imagen.";
      setLocalErrorMessage(msg);
      setErrorMessage(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-3">
      <label className="form-label">Subir imagen</label>
      <input type="file" className="form-control" onChange={handleFileChange} />

      {uploading && <p className="text-info mt-2">Subiendo imagen...</p>}

      {preview && (
        <div className="mt-3">
          <p>Vista previa:</p>
          <img src={preview} alt="Vista previa" style={{ width: "200px", borderRadius: "10px" }} />
        </div>
      )}

      {localErrorMessage && <p className="text-danger mt-2">{localErrorMessage}</p>}
    </div>
  );
};

export default CloudinaryApiHotel;
