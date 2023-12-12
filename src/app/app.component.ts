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
  markers: Leaflet.Marker[] = [];
  selectedPoints: Leaflet.LatLng[] = [];
  quarteiraoPolygon: Leaflet.Polygon | undefined;
  searchControl!: any;
  searchQuery: string = '';
  viewBounds: Leaflet.LatLngBounds | undefined;

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
    this.quarteiraoPolygon = undefined;
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

    this.viewBounds = this.map.getBounds(); // Obtém a "view box" inicial

    // Adicione um evento de movimento do mapa para atualizar os limites quando o mapa é movido
    this.map.on('moveend', () => {
      this.viewBounds = this.map.getBounds();
      console.log('Novos limites da view box:', this.viewBounds);
    });
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

  searchStreet() {
    console.log('Pesquisando a rua:', this.searchQuery);

    // Faça a solicitação HTTP para o serviço do Nominatim
    this.http.get<any>(`https://nominatim.openstreetmap.org/search?format=json&q=${this.searchQuery}`)
      .subscribe(data => {
        if (data && data.length > 0) {
          const result = data[0];
          const latlng = Leaflet.latLng(result.lat, result.lon);

          // Limpa a camada do polígono anterior, se existir
          if (this.quarteiraoPolygon) {
            this.map.removeLayer(this.quarteiraoPolygon);
          }

          // Adiciona um marcador na localização encontrada
          const marker = Leaflet.marker(latlng, { draggable: true })
            .addTo(this.map)
            .bindPopup(`<b>${latlng.lat}, ${latlng.lng}</b>`);

          // Pan para a nova posição do marcador
          this.map.panTo(latlng);

          // Armazena o marcador para possível manipulação futura
          this.markers.push(marker);
        } else {
          console.warn('Nenhum resultado encontrado.');
        }
      }, error => {
        console.error('Erro ao realizar a busca:', error);
      });
  }

  // setupGeocoderControl() {
  //   this.searchControl = Leaflet.Control.geocoder({
  //     position: 'topright',
  //     geocoder: new Leaflet.Control.Geocoder.Nominatim(),
  //     collapsed: false,
  //     placeholder: 'Pesquisar rua...',
  //     showResultIcons: true,
  //     defaultMarkGeocode: false
  //   });

  //   this.searchControl.addTo(this.map);

  //   this.searchControl.on('markgeocode', (e: any) => {
  //     const latlng = e.geocode.center;
  //     console.log(`Selecionado: ${latlng.lat}, ${latlng.lng}`);

  //     // Limpa a camada do polígono anterior, se existir
  //     if (this.quarteiraoPolygon) {
  //       this.map.removeLayer(this.quarteiraoPolygon);
  //     }

  //     // Adiciona um marcador na localização selecionada
  //     const marker = Leaflet.marker(latlng, { draggable: true })
  //       .addTo(this.map)
  //       .bindPopup(`<b>${latlng.lat}, ${latlng.lng}</b>`);

  //     // Pan para a nova posição do marcador
  //     this.map.panTo(latlng);

  //     // Armazena o marcador para possível manipulação futura
  //     this.markers.push(marker);
  //   });
  // }
}
