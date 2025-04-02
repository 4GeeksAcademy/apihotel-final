import React from "react";

const CloudinaryApiHotel = ({ setPhotoUrl, setErrorMessage }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "Apihotel");

      fetch("https://api.cloudinary.com/v1_1/dnftnyi5g/image/upload", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.secure_url) {
            setPhotoUrl(data.secure_url);
            setErrorMessage("");
          } else {
            setErrorMessage("No se recibió la URL de la imagen");
          }
        })
        .catch((err) => {
          console.error("Error Cloudinary:", err);
          setErrorMessage("Error al subir la imagen.");
        });
    }
  };

  return (
    <input
      type="file"
      onChange={handleFileChange}
      accept="image/*"
      className="form-control form-control-sm"
    />
  );
};

export default CloudinaryApiHotel;
