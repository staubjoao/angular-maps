import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Leaflet from 'leaflet';
import 'leaflet-control-geocoder';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  map!: Leaflet.Map;
  selectedPoints: Leaflet.LatLng[] = [];
  circles: Leaflet.CircleMarker[] = [];
  quarteiraoPolygon: Leaflet.Polygon | undefined;
  searchControl!: any;
  searchQuery: string = '';
  viewBounds: Leaflet.LatLngBounds | undefined;
  mapActivated: boolean = false;
  nominatimURL: string = 'https://nominatim.openstreetmap.org/search?format=json&q=';

  constructor(private http: HttpClient) {
  }

  options = {
    layers: [
      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      })
    ],
    zoom: 16,
    maxZoom: 18,
    minZoom: 14,
    center: { lat: -23.410618, lng: -51.944181 }
  };

  resetSelection() {
    if (this.quarteiraoPolygon) {
      this.map.removeLayer(this.quarteiraoPolygon);
    }

    this.selectedPoints = [];
    this.circles.forEach(circle => this.map.removeLayer(circle));
    this.circles = [];
    this.quarteiraoPolygon = undefined;
  }

  salvarSelecao() {
    if (this.quarteiraoPolygon) {
      console.log(typeof (this.quarteiraoPolygon.getLatLngs()));
      this.quarteiraoPolygon.getLatLngs().forEach(ponto => {
        console.log(ponto.toString());
      });
    }
  }

  onMapReady($event: Leaflet.Map) {
    this.map = $event;
    this.setupMapClickEvent();

    this.viewBounds = this.map.getBounds();

    this.map.on('moveend', () => {
      this.viewBounds = this.map.getBounds();
      console.log('Novos limites da view box:', this.viewBounds);
    });

    if (this.mapActivated) {
      this.map.fitBounds(this.viewBounds);
    }
  }

  setupMapClickEvent() {
    this.map.on('click', (e) => {
      const latlng = e.latlng;
      console.log(`Clicou em: ${latlng.lat}, ${latlng.lng}`);

      this.selectedPoints.push(latlng);

      if (this.quarteiraoPolygon) {
        this.map.removeLayer(this.quarteiraoPolygon);
      }

      // Adiciona um círculo (círculo azul) para cada ponto
      const circle = Leaflet.circleMarker(latlng, {
        color: 'blue',
        fillColor: 'blue',
        fillOpacity: 0.5,
        radius: 10,
        interactive: true
      }).addTo(this.map);

      circle.on('dragend', (event) => this.circleDragEnd(event));


      this.circles.push(circle);

      if (this.selectedPoints.length >= 3) {
        const quarteiraoCoordinates: Leaflet.LatLngExpression[] = this.selectedPoints.map(point => Leaflet.latLng(point.lat, point.lng));
        this.quarteiraoPolygon = Leaflet.polygon(quarteiraoCoordinates, { color: 'red' }).addTo(this.map);
      }
    });
  }

  circleDragEnd(event: any) {
    this.selectedPoints = this.circles.map(circle => circle.getLatLng());
    if (this.quarteiraoPolygon) {
      this.map.removeLayer(this.quarteiraoPolygon);
    }

    if (this.selectedPoints.length >= 3) {
      const quarteiraoCoordinates: Leaflet.LatLngExpression[] = this.selectedPoints.map(point => Leaflet.latLng(point.lat, point.lng));
      this.quarteiraoPolygon = Leaflet.polygon(quarteiraoCoordinates, { color: 'red' }).addTo(this.map);
    }
  }

  mapClicked($event: any) {
    console.log($event.latlng.lat, $event.latlng.lng);
  }

  markerClicked($event: any, index: number) {
    console.log($event.latlng.lat, $event.latlng.lng);
  }

  searchStreet() {
    console.log('Pesquisando a rua:', this.searchQuery.replace(" ", "+"));

    this.http.get<any>(`${this.nominatimURL}${this.searchQuery.replace(" ", "+")}`)
      .subscribe(data => {
        if (data && data.length > 0) {
          const result = data[0];

          const streetBounds = Leaflet.latLngBounds(
            Leaflet.latLng(result.boundingbox[0], result.boundingbox[2]),
            Leaflet.latLng(result.boundingbox[1], result.boundingbox[3])
          );

          this.mapActivated = true;
          if (this.map) {
            this.map.fitBounds(streetBounds);
          }
        } else {
          console.warn('Nenhum resultado encontrado.');
        }
      }, error => {
        console.error('Erro ao realizar a busca:', error);
      });
  }
}
