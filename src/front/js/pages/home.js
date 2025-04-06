import React, { useContext } from "react";
import { Context } from "../store/appContext";
import "../../styles/home.css";
import { useNavigate } from "react-router-dom";
import logo from "../../img/logo.png";


import gestion from "../../img/gestion.png";

export const Home = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();

    if (!store) {
        return <div>Loading...</div>;
    }

    return (
        <div className="home-page">
            {/* --- Hero Section --- */}
            <section
                className="hero-section d-flex align-items-center py-5"
                style={{
                    background: "linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%)",
                    color: "white",
                    minHeight: "80vh"
                }}
            >
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-8 mx-auto text-center">
                            <h1 className="display-4 fw-bold mb-4">
                                Transforma la gestión de tu hotel con <span className="text-info">nuestra API</span>
                            </h1>
                            <p className="lead mb-4">
                                Automatiza incidencias, coordina equipos y optimiza recursos con una plataforma diseñada para la <strong>hotelería moderna</strong>.
                            </p>
                            <div className="d-flex gap-3 justify-content-center">
                                <button
                                    className="btn btn-info btn-lg px-4"
                                    onClick={() => navigate("/demo")}
                                >
                                    Ver Demo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Features --- */}
            <section className="py-5">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="fw-bold">Solución Todo-en-Uno</h2>
                        <p className="text-muted">Gestiona todo tu hotel sin complicaciones.</p>
                    </div>
                    <div className="row g-4 justify-content-center">
                        {[
                            {
                                icon: "🏨",
                                title: "Multi-sucursal",
                                desc: "Control centralizado para todas tus ubicaciones.",
                                color: "text-primary"
                            },
                            {
                                icon: "🛠️",
                                title: "Mantenimiento",
                                desc: "Asignación inteligente de tareas a técnicos.",
                                color: "text-success"
                            },
                            {
                                icon: "🧹",
                                title: "Limpieza",
                                desc: "Seguimiento en tiempo real de las camareras.",
                                color: "text-warning"
                            },
                            {
                                icon: "🤖",
                                title: "IA en Mantenimiento",
                                desc: "“Mantenito”: ayuda técnica con inteligencia artificial en tiempo real.",
                                color: "text-info"
                            }
                        ].map((feature, index) => (
                            <div key={index} className="col-12 col-md-6">
                                <div className="card h-100 border-0 shadow-sm p-4 hover-scale text-center">
                                    <div className={`fs-1 mb-3 ${feature.color}`}>{feature.icon}</div>
                                    <h3 className="h6 fw-bold">{feature.title}</h3>
                                    <p className="text-muted">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* --- How it Works --- */}
            <section className="py-5 bg-light">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-8">
                            <h2 className="fw-bold mb-4">Flujo de trabajo optimizado</h2>
                            <ul className="list-unstyled">
                                {[
                                    "Reporte de incidencia → Asignación automática → Notificación al técnico → Resolución → Confirmación",
                                    "Dashboard en tiempo real para administradores.",
                                    "Ayuda para mantenimiento con ai en tiempo real"
                                ].map((item, index) => (
                                    <li key={index} className="mb-3 d-flex align-items-start">
                                        <span className="me-2 text-primary">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="col-lg-6">
                            {/* Espacio para gráficos o imágenes */}
                        </div>
                    </div>
                </div>
            </section>
            {/* --- Features Section --- */}
            <section className="py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="text-center">
                                <h1 className="mt-0"><i className="mdi mdi-heart-multiple-outline"></i></h1>
                                <h3>Características que <span className="text-danger">amarás</span></h3>
                                <p className="text-muted mt-2">Nuestra plataforma ofrece las mejores herramientas para la gestión hotelera</p>
                            </div>
                        </div>
                    </div>

                    {/* Primera fila de características */}
                    <div className="row mt-2 py-5 align-items-center">
                        <div className="col-lg-5 col-md-6">
                            <img
                                src={gestion}
                                className="img-fluid"
                                alt="Gestión integrada"
                            />
                        </div>
                        <div className="col-lg-6 offset-md-1 col-md-5">
                            <div className="col-lg-6 offset-md-1 col-md-5">
                                <h3 className="fw-normal">Aplicaciones integradas</h3>
                                <div className="mt-4">
                                    <p className="text-muted">
                                        <i className="mdi mdi-circle-medium text-primary"></i> Reportes y estadísticas
                                    </p>

                                    <p className="text-muted mt-3">Diseño intuitivo</p>

                                    <p className="text-muted">
                                        <i className="mdi mdi-circle-medium text-success"></i> Navegación simplificada
                                    </p>
                                    <p className="text-muted">
                                        <i className="mdi mdi-circle-medium text-success"></i> Personalización de temas
                                    </p>
                                    <p className="text-muted">
                                        <i className="mdi mdi-circle-medium text-success"></i> Acceso multiplataforma
                                    </p>

                                    {/* APIs externas utilizadas */}
                                    <p className="text-muted mt-4">Integración con APIs</p>


                                    <p className="text-muted d-flex align-items-center">
                                         Cloudinary API
                                    </p>

                                    <p className="text-muted d-flex align-items-center">
                                         Google Maps API
                                    </p>

                                    <p className="text-muted d-flex align-items-center">
                                        OpenAI API
                                    </p>



                                </div>
                            </div>
                        </div>

                    </div>
                </div>


            </section>


            {/* --- Equipo de Desarrollo --- */}
            <section className="py-5">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="fw-bold">Nuestro Equipo</h2>
                        <p className="text-muted">Conoce a los desarrolladores del proyecto</p>
                    </div>
                    <div className="row g-4">
                        {[
                            {
                                name: "Milton",

                                photo: "https://res.cloudinary.com/dnftnyi5g/image/upload/v1743179716/milton_sy2lcp.jpg",
                                social: {
                                    github: "https://github.com/allisonjuliana",
                                    linkedin: "#"
                                }
                            },
                            {
                                name: "Monique",

                                photo: "https://res.cloudinary.com/dnftnyi5g/image/upload/v1743157250/Imagen_de_WhatsApp_2025-03-28_a_las_11.14.35_a8d7dc6e_thlbqe.jpg",
                                social: {
                                    github: "https://github.com/Niquemenezes",
                                    linkedin: "https://www.linkedin.com/in/monique-menezes-459589190/"
                                }
                            },
                            {
                                name: "Antonio",

                                photo: "https://res.cloudinary.com/dnftnyi5g/image/upload/v1743179716/antonio_vlpj6o.jpg",
                                social: {
                                    github: "https://github.com/tony42cadiz",
                                    linkedin: "#"
                                }
                            }
                        ].map((dev, index) => (
                            <div key={index} className="col-md-4">
                                <div className="card h-100 border-0 shadow-sm p-4 hover-scale">
                                    <img
                                        src={dev.photo}
                                        alt={dev.name}
                                        className="rounded-circle mx-auto mb-4"
                                        style={{
                                            width: "150px",
                                            height: "150px",
                                            objectFit: "cover"
                                        }}
                                    />
                                    <h3 className="h5 fw-bold text-center">{dev.name}</h3>
                                    <p className="text-muted text-center mb-3">{dev.role}</p>
                                    <p className="text-center">{dev.bio}</p>
                                    <div className="d-flex justify-content-center gap-3 mt-3">
                                        {Object.entries(dev.social).map(([platform, link]) => (
                                            <a
                                                key={platform}
                                                href={link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-decoration-none text-dark"
                                            >
                                                <i className={`fab fa-${platform} fs-4`}></i>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CTA Final --- */}
            <section className="py-5 text-white"
                style={{
                    background: "linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%)"
                }}>
                <div className="container text-center">
                    <h2 className="fw-bold mb-4">¿Listo para optimizar tu operación?</h2>
                    <p className="lead mb-4">Contáctanos para una demo personalizada.</p>
                 </div>   
            </section>

            {/* --- Contact Form --- */}
            <section className="py-5 bg-light border-top border-bottom border-light">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="text-center">
                                <h3>Contacta con <span className="text" style={{color:"#0dcaf0"}}>Nosotros</span></h3>
                                <p className="text-muted mt-2">
                                    ¿Tienes preguntas? Escríbenos y te responderemos a la brevedad.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="row align-items-center mt-3">
                        <div className="col-md-4">
                            <p className="text-muted">
                                <span className="fw-bold">Soporte:</span><br />
                                <span className="d-block mt-1">+34 234 567 890</span>
                            </p>
                            <p className="text-muted mt-4">
                                <span className="fw-bold">Email:</span><br />
                                <span className="d-block mt-1">equipo@apihotel.com</span>
                            </p>
                            <p className="text-muted mt-4">
                                <span className="fw-bold">Oficina:</span><br />
                                <span className="d-block mt-1">Calle Falsa 123, Madrid, España</span>
                            </p>
                        </div>

                        <div className="col-md-7">
                            <form>
                                <div className="row mt-4">
                                    <div className="col-lg-6">
                                        <div className="mb-2">
                                            <label htmlFor="nombre" className="form-label">Nombre</label>
                                            <input className="form-control py-2" type="text" id="nombre" placeholder="Tu nombre" />
                                        </div>
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="mb-2">
                                            <label htmlFor="email" className="form-label">Email</label>
                                            <input className="form-control py-2" type="email" id="email" placeholder="tucorreo@ejemplo.com" />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-1">
                                    <div className="col-lg-12">
                                        <div className="mb-2">
                                            <label htmlFor="asunto" className="form-label">Asunto</label>
                                            <input className="form-control py-2" type="text" id="asunto" placeholder="Motivo de tu consulta" />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-1">
                                    <div className="col-lg-12">
                                        <div className="mb-2">
                                            <label htmlFor="mensaje" className="form-label">Mensaje</label>
                                            <textarea id="mensaje" rows="4" className="form-control" placeholder="Escribe tu mensaje aquí..."></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-2">
                                    <div className="col-12 text-end">
                                        <button className="btn" style={{background:" #0dcaf0"}}>Enviar Mensaje</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-dark py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-6">
                            <img src={logo} alt="ApiHotel Logo" style={{ height: "120px", objectFit: "contain" }} />
                            <p className="text-light text-opacity-50 mt-4">
                                Nuestra solución hotelera transforma la gestión de tu negocio
                                <br /> con tecnología innovadora y fácil de usar.
                            </p>

                            <ul className="social-list list-inline mt-3">
                                <li className="list-inline-item text-center">
                                    <a href="#!" className="social-list-item border-primary text-primary"><i className="mdi mdi-facebook"></i></a>
                                </li>
                                <li className="list-inline-item text-center">
                                    <a href="#!" className="social-list-item border-danger text-danger"><i className="mdi mdi-google"></i></a>
                                </li>
                                <li className="list-inline-item text-center">
                                    <a href="#!" className="social-list-item border-info text-info"><i className="mdi mdi-twitter"></i></a>
                                </li>
                                <li className="list-inline-item text-center">
                                    <a href="#!" className="social-list-item border-secondary text-secondary"><i className="mdi mdi-github"></i></a>
                                </li>
                            </ul>
                        </div>

                        <div className="col-lg-2 col-md-4 mt-3 mt-lg-0">
                            <h5 className="text-light">Empresa</h5>
                            <ul className="list-unstyled ps-0 mb-0 mt-3">
                                <li className="mt-2"><a href="#!" className="text-light text-opacity-50">Sobre nosotros</a></li>
                                <li className="mt-2"><a href="#!" className="text-light text-opacity-50">Documentación</a></li>
                            </ul>
                        </div>

                        <div className="col-lg-2 col-md-4 mt-3 mt-lg-0">
                            <h5 className="text-light">Soluciones</h5>
                            <ul className="list-unstyled ps-0 mb-0 mt-3">
                                <li className="mt-2"><a href="#!" className="text-light text-opacity-50">Gestión hotelera</a></li>
                                <li className="mt-2"><a href="#!" className="text-light text-opacity-50">Mantenimiento</a></li>
                                <li className="mt-2"><a href="#!" className="text-light text-opacity-50">Limpieza</a></li>
                                <li className="mt-2"><a href="#!" className="text-light text-opacity-50">Reportes</a></li>
                            </ul>
                        </div>

                        <div className="col-lg-2 col-md-4 mt-3 mt-lg-0">
                            <h5 className="text-light">Legal</h5>
                            <ul className="list-unstyled ps-0 mb-0 mt-3">
                                <li className="mt-2"><a href="#!" className="text-light text-opacity-50">Términos de uso</a></li>
                                <li className="mt-2"><a href="#!" className="text-light text-opacity-50">Política de privacidad</a></li>
                                <li className="mt-2"><a href="#!" className="text-light text-opacity-50">Soporte</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-12">
                            <div className="mt-5">
                                <p className="text-light text-opacity-50 mt-4 text-center mb-0">
                                    © {new Date().getFullYear()} ApiHotel Solution. Todos los derechos reservados
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

