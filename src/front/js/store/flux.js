const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			message: null,
			demo: [
				{
					title: "FIRST",
					background: "white",
					initial: "white"
				},
				{
					title: "SECOND",
					background: "white",
					initial: "white"
				}
			],
			auth: false,
			hoteles: [],
			housekeepers: [],
			maintenances: [],
			housekeeperTasks: [],
			maintenanceTasks: [],
			branches: [],
			categories: [],
			rooms: [],
			token: localStorage.getItem("token") || null,
			hotel: JSON.parse(localStorage.getItem("hotel")) || null,
		},
		actions: {
			// Use getActions to call a function within a fuction
			exampleFunction: () => {
				getActions().changeColor(0, "green");
			},

			setCategories: (categories) => {
				setStore({ categories })
			},

			setRooms: (rooms) => {
				setStore({ rooms });
			},

			logout: () => {
				console.log("logout")
				localStorage.removeItem("token");
				setStore({ auth: false, token: null, hotel: null });
			},

			login: (email, password) => {
				const requestOptions = {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
				};

				return fetch(process.env.BACKEND_URL + "/api/loginhotel", requestOptions)
					.then((response) => {
						if (response.status === 200) {
							return response.json().then(async (data) => {
								localStorage.setItem("token", data.access_token);
								setStore({ auth: true, token: data.access_token });

								// Llamar a getHotelInfo luego del login
								await getActions().getHotelInfo();

								return true;
							});
						} else {
							setStore({ auth: false });
							return false;
						}
					});
			},

			getHotelInfo: async () => {
				const store = getStore();
				const token = store.token;

				if (!token) return;

				try {
					const response = await fetch(process.env.BACKEND_URL + "/api/hoteles_by_hotel", {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Authorization: "Bearer " + token,
						},
					});

					if (response.ok) {
						const data = await response.json();
						setStore({ hotel: data });
						localStorage.setItem("hotel", JSON.stringify(data));
					} else {
						console.error("No se pudo obtener info del hotel");
					}
				} catch (error) {
					console.error("Error en getHotelInfo", error);
				}
			},


			signup: async (nombre, email, password) => {
				try {
					const res = await fetch(process.env.BACKEND_URL + "/api/signuphotel", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ nombre, email, password })
					});

					if (!res.ok) {
						const errorText = await res.text();
						console.error("Error en el registro:", errorText);
						return false;
					}

					return true;
				} catch (err) {
					console.error("Error en signup:", err);
					return false;
				}
			},


			// Para hoteles
			getHoteles: async () => {
				try {
					const res = await fetch(process.env.BACKEND_URL + "/api/hoteles");
					const data = await res.json();
					setStore({ hoteles: data });
				} catch (error) {
					console.error("Error al obtener hoteles:", error);
				}
			},
			getHotelByToken: async () => {
				const store = getStore();

				try {
					const res = await fetch(process.env.BACKEND_URL + "/api/hoteles_by_hotel", {
						headers: {
							Authorization: "Bearer " + store.token
						}
					});

					if (!res.ok) throw new Error("Error al obtener hotel autenticado");

					const data = await res.json();
					setStore({ hoteles: [data] }); // ← Lo guardamos como array para poder usar `.map` sin errores
				} catch (error) {
					console.error("Error al obtener hotel autenticado:", error);
				}
			},


			updateAuthenticatedHotel: async (hotelData) => {
				const store = getStore();
				const res = await fetch(process.env.BACKEND_URL + "/api/hoteles_by_hotel", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token
					},
					body: JSON.stringify(hotelData)
				});

				if (!res.ok) {
					const error = await res.json();
					throw new Error(error.msg || "Error al actualizar el hotel");
				}

				const updatedHotel = await res.json();
				setStore({ hotel: updatedHotel });
				localStorage.setItem("hotel", JSON.stringify(updatedHotel));
				return updatedHotel;
			},

			deleteAuthenticatedHotel: async () => {
				const store = getStore();
				const res = await fetch(process.env.BACKEND_URL + "/api/hoteles_by_hotel", {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token
					}
				});

				if (!res.ok) {
					const error = await res.json();
					throw new Error(error.msg || "Error al eliminar el hotel");
				}

				localStorage.removeItem("token");
				localStorage.removeItem("hotel");
				setStore({ auth: false, token: null, hotel: null });
				return true;
			},
			createHotelAuthenticated: async (hotelData) => {
				const store = getStore();
				try {
					const res = await fetch(process.env.BACKEND_URL + "/api/hoteles_by_hotel", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: "Bearer " + store.token
						},
						body: JSON.stringify(hotelData)
					});

					if (!res.ok) throw new Error("Error al crear el hotel desde hotel autenticado");
					const data = await res.json();
					return data; // hotel creado
				} catch (err) {
					console.error("Error en createHotelAuthenticated:", err);
					throw err;
				}
			},



			// Para branches

			getBranches: async () => {
				const store = getStore();
				const res = await fetch(process.env.BACKEND_URL + "/api/branches_by_hotel", {
					headers: { Authorization: "Bearer " + store.token }
				});
				const data = await res.json();
				setStore({ branches: data });
			},

			createOrUpdateBranch: async (branchData, branchSeleccionado) => {
				const store = getStore();
				const method = branchSeleccionado ? "PUT" : "POST";
				const url = branchSeleccionado
					? `${process.env.BACKEND_URL}/api/branches_by_hotel/${branchSeleccionado.id}`
					: `${process.env.BACKEND_URL}/api/branches_by_hotel`;

				const res = await fetch(url, {
					method,
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token,
					},
					body: JSON.stringify(branchData),
				});
				if (!res.ok) throw new Error("Error al crear o actualizar branch");
				return await res.json();
			},

			deleteBranch: async (id) => {
				const store = getStore();
				const res = await fetch(`${process.env.BACKEND_URL}/api/branches_by_hotel/${id}`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token,
					},
				});
				if (!res.ok) throw new Error("Error al eliminar branch");
			},

			// habitacion por branche
			getRoomsByBranch: (branchId) => {
				const token = localStorage.getItem("token");
				fetch(`${process.env.BACKEND_URL}/api/rooms_by_branch/${branchId}`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + token,
					},
				})
					.then((res) => res.json())
					.then((data) => {
						setStore({ rooms: data });
					})
					.catch((err) => console.error("Error al obtener habitaciones por sucursal:", err));
			},


			// Obtener todas las habitaciones del hotel autenticado
			getRooms: () => {
				const store = getStore();
				console.log("Token:", store.token); // Verifica que el token esté presente

				fetch(process.env.BACKEND_URL + "/api/rooms_by_hotel", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token, // ← Asegúrate que token es válido
					},
				})
					.then((response) => {
						if (!response.ok) {
							throw new Error(`HTTP error! Status: ${response.status}`);
						}
						return response.json();
					})
					.then((data) => {
						console.log("Rooms fetched from API:", data);
						setStore({ rooms: data }); // ← Guarda en el store
					})
					.catch((error) => {
						console.error("Error:", error);
					});
			},


			// Crear o actualizar una habitación (POST si no existe, PUT si ya existe)
			createOrUpdateRoom: (roomData, roomSeleccionado) => {
				const store = getStore();
				const method = roomSeleccionado ? "PUT" : "POST";
				const url = roomSeleccionado
					? `${process.env.BACKEND_URL}/api/rooms_by_hotel/${roomSeleccionado.id}`
					: `${process.env.BACKEND_URL}/api/rooms_by_hotel`;
				console.log("Enviando roomData:", roomData);


				return fetch(url, {
					method,
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token,
					},
					body: JSON.stringify(roomData),
				})
					.then((res) => {
						if (!res.ok) throw new Error("Error al crear o actualizar habitación");
						return res.json();
					})
					.then((data) => {
						setStore({
							rooms: roomSeleccionado
								? store.rooms.map((room) =>
									room.id === roomSeleccionado.id ? data : room
								)
								: [...store.rooms, data],
						});
						return data;
					})
					.catch((error) => {
						console.error("Error en createOrUpdateRoom:", error);
						throw error;
					});
			},



			// Eliminar una habitación
			deleteRoom: (id) => {
				const store = getStore();
				return fetch(`${process.env.BACKEND_URL}/api/rooms_by_hotel/${id}`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token,
					},
				})
					.then((res) => {
						if (!res.ok) throw new Error("Error al eliminar habitación");

						setStore({ rooms: store.rooms.filter((room) => room.id !== id) });
						return true;
					})
					.catch((error) => {
						console.error("Error en deleteRoom:", error);
						throw error;
					});
			},

			createMultipleRooms: async ({ branch_id, floors, rooms_per_floor }) => {
				try {
					const token = localStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/bulk_create_rooms", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ branch_id, floors, rooms_per_floor }),
					});

					if (!resp.ok) throw new Error("Error al crear habitaciones automáticamente");

					const data = await resp.json();
					await getActions().getRooms();
					return data;
				} catch (error) {
					console.error("bulkCreateRooms error:", error);
					return null;
				}
			},





			// para housekeepers

			getHousekeepers: () => {
				const store = getStore();

				if (!store.token) {
					console.error("No hay token disponible");
					return;
				}

				fetch(process.env.BACKEND_URL + "/api/housekeepers_by_hotel", {
					headers: {
						Authorization: "Bearer " + store.token
					}
				})
					.then(res => {
						if (!res.ok) {
							return res.text().then(text => {
								throw new Error(`Error ${res.status}: ${text}`);
							});
						}
						return res.json();
					})
					.then(data => {
						setStore({ housekeepers: data });
					})
					.catch(error => {
						console.error("Error al obtener housekeepers:", error.message);
					});
			},
			// crear housekeeper
			createHousekeeper: (data) => {
				const store = getStore();
				fetch(process.env.BACKEND_URL + "/api/housekeeper_by_hotel", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token
					},
					body: JSON.stringify(data)
				})
					.then(res => res.json())
					.then(() => getActions().getHousekeepers())
					.catch(err => console.error("Error al crear housekeeper", err));
			},

			updateHousekeeper: (id, data) => {
				const token = localStorage.getItem("token");

				fetch(`${process.env.BACKEND_URL}/api/housekeeper_by_hotel/${id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + token
					},
					body: JSON.stringify(data)
				})
					.then(resp => {
						if (!resp.ok) {
							throw new Error("Error al actualizar camarera");
						}
						return resp.json();
					})
					.then(result => {
						console.log("Actualizado:", result);
						getActions().getHousekeepers(); // ✅ refresca la lista
					})
					.catch(err => {
						console.error("Error updateHousekeeper:", err);
					});
			},



			deleteHousekeeper: (id) => {
				const store = getStore();
				fetch(process.env.BACKEND_URL + `/api/housekeeper_by_hotel/${id}`, {
					method: "DELETE",
					headers: {
						Authorization: "Bearer " + store.token
					}
				})
					.then(() => getActions().getHousekeepers())
					.catch(err => console.error("Error al eliminar housekeeper", err));
			},

			// En flux.js dentro de actions:

			bulkCreateHousekeeperTasks: async ({ nombre, photo_url, condition, assignment_date, submission_date, id_housekeeper, room_ids }) => {
				try {
					const token = localStorage.getItem("token");
					const resp = await fetch(process.env.BACKEND_URL + "api/bulk_housekeeper_tasks", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({
							nombre,
							photo_url,
							condition,
							assignment_date,
							submission_date,
							id_housekeeper,
							room_ids,
						}),
					});

					if (!resp.ok) throw new Error("Error al crear tareas de limpieza en lote");

					const data = await resp.json();
					await actions.getHouseKeeperTasks(); // refresca tareas
					return data;
				} catch (error) {
					console.error("bulkCreateHousekeeperTasks error:", error);
					return null;
				}
			},



			// GET: Obtiene los mantenimientos del hotel autenticado
			getMaintenances: () => {
				const store = getStore();
				if (!store.token) return;
			
				fetch(process.env.BACKEND_URL + "/api/maintenance_by_hotel", {
					method: "GET",
					headers: {
						Authorization: "Bearer " + store.token,
					},
				})
					.then((res) => {
						if (!res.ok) throw new Error("No se pudo obtener la lista de técnicos");
						return res.json();
					})
					.then((data) => {
						setStore({ maintenances: data });
					})
					.catch((err) => console.error("Error al obtener técnicos:", err));
			},
			

			postMaintenance: (maintenanceData) => {
				const store = getStore();
				fetch(process.env.BACKEND_URL + "/api/maintenance_by_hotel", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token,
					},
					body: JSON.stringify(maintenanceData),
				})
					.then((res) => {
						if (!res.ok) throw new Error("No se pudo crear el técnico");
						return res.json();
					})
					.then((newTech) => {
						setStore({ maintenances: [...store.maintenances, newTech] });
					})
					.catch((err) => console.error("Error al crear técnico:", err));
			},

			putMaintenance: (id, maintenanceData) => {
				const store = getStore();
				fetch(process.env.BACKEND_URL + `/api/maintenance_by_hotel/${id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token,
					},
					body: JSON.stringify(maintenanceData),
				})
					.then((res) => {
						if (!res.ok) throw new Error("No se pudo actualizar el técnico");
						return res.json();
					})
					.then((updatedTech) => {
						const updatedList = store.maintenances.map((t) =>
							t.id === updatedTech.id ? updatedTech : t
						);
						setStore({ maintenances: updatedList });
					})
					.catch((err) => console.error("Error al actualizar técnico:", err));
			},

			deleteMaintenance: (id) => {
				const store = getStore();
				fetch(process.env.BACKEND_URL + `/api/maintenance_by_hotel/${id}`, {
					method: "DELETE",
					headers: {
						Authorization: "Bearer " + store.token,
					},
				})
					.then((res) => {
						if (!res.ok) throw new Error("No se pudo eliminar el técnico");
						return res.json();
					})
					.then(() => {
						const newList = store.maintenances.filter((t) => t.id !== id);
						setStore({ maintenances: newList });
					})
					.catch((err) => console.error("Error al eliminar técnico:", err));
			},


			//tareas de mantenimiento
			getMaintenanceTasks: async () => {
				const store = getStore();
				try {
				  const res = await fetch(process.env.BACKEND_URL + "/api/maintenancetask_by_hotel", {
					headers: { Authorization: "Bearer " + store.token }
				  });
				  
				  if (!res.ok) throw new Error("Error al obtener tareas");
				  const data = await res.json();
				  
				  setStore({ maintenanceTasks: data });
				  return data;
				} catch (error) {
				  console.error("Error en getMaintenanceTasks:", error);
				  throw error;
				}
			  },
		  
			  createMaintenanceTask: async (data) => {
				const store = getStore();
				try {
				  const res = await fetch(process.env.BACKEND_URL + "/api/maintenancetask_by_hotel", {
					method: "POST",
					headers: {
					  "Content-Type": "application/json",
					  Authorization: "Bearer " + store.token
					},
					body: JSON.stringify({ ...data, condition: "PENDIENTE" })
				  });
		  
				  if (!res.ok) {
					const errorText = await res.text();
					throw new Error(errorText || "Error al crear tarea");
				  }
		  
				  const newTask = await res.json();
				   // Actualización optimista
				   setStore({
					maintenanceTasks: [...store.maintenanceTasks, newTask]
				  });
		  
				  return newTask;
				} catch (error) {
				  console.error("Error en createMaintenanceTask:", error);
				  throw error;
				}
			  },
			

			  updateMaintenanceTask: async (id, data) => {
				const store = getStore();
				try {
				  const res = await fetch(`${process.env.BACKEND_URL}/api/maintenancetask_by_hotel/${id}`, {
					method: "PUT",
					headers: {
					  "Content-Type": "application/json",
					  Authorization: "Bearer " + store.token
					},
					body: JSON.stringify(data)
				  });
			  
				  if (!res.ok) throw new Error("Error al actualizar la tarea");
			  
				  const updatedTask = await res.json();
			  
				  const updatedTasks = store.maintenanceTasks.map(t =>
					t.id === id ? updatedTask : t
				  );
			  
				  setStore({ maintenanceTasks: updatedTasks }); // ✅ aquí el nombre correcto
			  
				  return updatedTask;
				} catch (error) {
				  console.error("Error en updateMaintenanceTask:", error);
				  throw error;
				}
			  },
			  
			  

			deleteMaintenanceTask: (id) => {
				const store = getStore();
				fetch(`${process.env.BACKEND_URL}/api/maintenancetask_by_hotel/${id}`, {
					method: "DELETE",
					headers: {
						Authorization: "Bearer " + store.token
					}
				})
					.then(res => {
						if (!res.ok) throw new Error("Error al eliminar la tarea");
						return res.json(); // <-- Añadir esto
					})
					.then(() => {
						const newList = getStore().maintenanceTasks.filter(t => t.id !== id);
						setStore({ maintenanceTasks: newList });
					})
					.catch(error => {
						console.error("Error en deleteMaintenanceTask:", error);
					});
			},

			// housekeepertask
			getHouseKeeperTasks: () => {
				const store = getStore();
				fetch(process.env.BACKEND_URL + "/api/housekeeper_tasks_by_hotel", {
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token
					}
				})
					.then(res => {
						if (!res.ok) throw new Error("Error al obtener las tareas");
						return res.json();
					})
					.then(data => {
						setStore({ housekeeperTasks: data }); 
					})
					.catch(error => {
						console.error("Error en getHouseKeeperTasks:", error);
					});
			},
			

			createHouseKeeperTask: (data) => {
				const store = getStore();
				fetch(process.env.BACKEND_URL + "/api/housekeeper_tasks_by_hotel", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + store.token
					},
					body: JSON.stringify(data)
				})
					.then(res => {
						if (!res.ok) throw new Error("Error al crear la tarea");
						return res.json();
					})
					.then(newTask => {
						const currentTasks = getStore().housekeeperTasks || [];
						const updatedList = [...currentTasks, newTask];
						setStore({ housekeeperTasks: updatedList });
					})
					.catch(error => {
						console.error("Error en createHouseKeeperTask:", error);
					});
			},

			updateHouseKeeperTask: (id, data) => {
				const store = getStore();
				fetch(`${process.env.BACKEND_URL}/api/housekeeper_tasks_by_hotel/${id}`, {
				  method: "PUT",
				  headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + store.token
				  },
				  body: JSON.stringify(data)
				})
				  .then(res => {
					if (!res.ok) throw new Error("Error al actualizar la tarea");
					return res.json();
				  })
				  .then(updated => {
					const newList = store.housekeeperTasks.map(t =>
					  t.id === id ? updated : t
					);
					setStore({ housekeeperTasks: newList });
				  })
				  .catch(error => {
					console.error("Error en updateHouseKeeperTask:", error);
				  });
			  },
			  

			deleteHouseKeeperTask: (id) => {
				const store = getStore();
				fetch(`${process.env.BACKEND_URL}/api/housekeeper_tasks_by_hotel/${id}`, {
					method: "DELETE",
					headers: {
						Authorization: "Bearer " + store.token
					}
				})
					.then(res => {
						if (!res.ok) throw new Error("Error al eliminar la tarea");
						return res.json();
					})
					.then(() => {
						const filtered = getStore().housekeeperTasks.filter(t => t.id !== id);
						setStore({ housekeeperTasks: filtered });
					})
					.catch(error => {
						console.error("Error en deleteHouseKeeperTask:", error);
					});
			},


			getHotelDatos: async () => {
				const store = getStore();

				try {
					const response = await fetch(process.env.BACKEND_URL + "/api/datos_by_hotel", {
						headers: {
							"Content-Type": "application/json",
							Authorization: "Bearer " + store.token
						}
					});

					if (!response.ok) throw new Error("No se pudieron cargar las estadísticas");

					const data = await response.json();
					return data;

				} catch (error) {
					console.error("Error en getHotelStats:", error);
					throw error;
				}
			},

			getHotelDatos: async () => {
				try {
				  const resp = await fetch(process.env.BACKEND_URL + "/api/datos_by_hotel", {
					method: "GET",
					headers: {
					  "Authorization": "Bearer " + localStorage.getItem("token")
					}
				  });
				  const data = await resp.json();
				  if (resp.ok) return data;
				  else throw new Error(data.message);
				} catch (error) {
				  console.error("Error cargando datos del dashboard:", error);
				  return {};
				}
			  },
			  


			getMessage: async () => {
				try {
					const resp = await fetch(process.env.BACKEND_URL + "/api/hello");
					const data = await resp.json();
					setStore({ message: data.message });
					return data;
				} catch (error) {
					console.log("Error loading message from backend", error);
				}
			},

		},
	};
};

export default getState;