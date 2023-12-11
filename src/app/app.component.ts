import { Component } from '@angular/core';
import * as Leaflet from 'leaflet';
import 'leaflet-control-geocoder';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  map!: Leaflet.Map;
  markers: Leaflet.Marker[] = [];
  selectedPoints: Leaflet.LatLng[] = [];
  quarteiraoPolygon: Leaflet.Polygon | undefined;

  options = {
    layers: [
      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      })
    ],
    zoom: 16,
    center: { lat: -23.410618, lng: -51.944181 }
  };

  resetSelection() {
    if (this.quarteiraoPolygon) {
      this.map.removeLayer(this.quarteiraoPolygon);
    }

    this.selectedPoints = [];
  }

  salvarSelecao() {
    if (this.quarteiraoPolygon) {
      console.log(typeof(this.quarteiraoPolygon.getLatLngs()))
      this.quarteiraoPolygon.getLatLngs().forEach(ponto => {
        console.log(ponto.toString());
      });
    }
  }

  generateMarker(data: any, index: number) {
    return Leaflet.marker(data.position, { draggable: data.draggable })
      .on('click', (event) => this.markerClicked(event, index))
      .on('dragend', (event) => this.markerDragEnd(event, index));
  }

  onMapReady($event: Leaflet.Map) {
    this.map = $event;
    this.setupMapClickEvent();
  }

  setupMapClickEvent() {
    this.map.on('click', (e) => {
      const latlng = e.latlng;
      console.log(`Clicou em: ${latlng.lat}, ${latlng.lng}`);

      // Adiciona ponto aos pontos selecionados
      this.selectedPoints.push(latlng);

      // Remove a camada do polígono anterior, se existir
      if (this.quarteiraoPolygon) {
        this.map.removeLayer(this.quarteiraoPolygon);
      }

      // Desenha o polígono se houver pontos suficientes (por exemplo, 3 para um triângulo, 4 para um quadrado)
    if (this.selectedPoints.length >= 3) {
      const quarteiraoCoordinates: Leaflet.LatLngExpression[] = this.selectedPoints.map(point => Leaflet.latLng(point.lat, point.lng));
      this.quarteiraoPolygon = Leaflet.polygon(quarteiraoCoordinates, { color: 'red' }).addTo(this.map);
    }
  });
  }

  mapClicked($event: any) {
    console.log($event.latlng.lat, $event.latlng.lng);
  }

  markerClicked($event: any, index: number) {
    console.log($event.latlng.lat, $event.latlng.lng);
  }

  markerDragEnd($event: any, index: number) {
    console.log($event.target.getLatLng());
  }

  getAddress(lat: number, lng: number) {
    const geocoder = (Leaflet.Control as any).Geocoder.nominatim();
    return new Promise((resolve, reject) => {
      geocoder.reverse(
        { lat, lng },
        this.map.getZoom(),
        (results: any) => results.length ? resolve(results[0].name) : reject(null)
      );
    });
  }
}
