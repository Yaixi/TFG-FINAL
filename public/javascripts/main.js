async function buscarZona() {
  const zona = document.getElementById('input-zona').value;

  if (!zona) return alert("Introduce una zona o código postal");

  // Petición a Nominatim para obtener coordenadas
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(zona + ', Madrid')}`);
  const data = await response.json();

  if (data.length === 0) return alert("Zona no encontrada");

  const { lat, lon } = data[0];
  const centro = [parseFloat(lat), parseFloat(lon)];

  // Centrar el mapa
  map.setView(centro, 15);

  // Dibujar el buffer
  if (window.bufferLayer) map.removeLayer(window.bufferLayer); // Quitar anterior
  window.bufferLayer = L.circle(centro, {
    radius: 600, // metros
    color: 'blue',
    fillOpacity: 0.2
  }).addTo(map);

  // Llamar al backend para obtener lugares dentro del buffer
  obtenerLugaresDentroBuffer(lon, lat, 600);
}
async function obtenerLugaresDentroBuffer(lon, lat, distancia) {
  const response = await fetch(`/api/lugares-buffer?lon=${lon}&lat=${lat}&dist=${distancia}`);
  const lugares = await response.json();

  // Puedes quitar marcadores anteriores si quieres
  // Mostrar los nuevos en el mapa:
  lugares.forEach(lugar => {
    const marker = L.marker([lugar.location.coordinates[1], lugar.location.coordinates[0]]);
    marker.bindPopup(`<b>${lugar.nombre}</b><br>${lugar.descripcion || ""}`);
    marker.addTo(map);
  });
}
