import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Leaflet from 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet-editable';

import { Quarteirao } from './model/quarteirao';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  numero: number | undefined;
  map!: Leaflet.Map;
  pontosSelecionados: Leaflet.LatLng[] = [];
  circulos: Leaflet.Marker[] = [];
  quarteiraoPoligono: Leaflet.Polygon | undefined;
  quarteiroes: Quarteirao[] = [];
  enderecoPesquisa: string = '';
  numeroQuarteirao: string = '';

  bordasMapa: Leaflet.LatLngBounds | undefined;
  mapaAtivado: boolean = false;
  nominatimURL: string =
    'https://nominatim.openstreetmap.org/search?format=json&q=';

  constructor(private http: HttpClient) {}

  options = {
    layers: [
      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }),
    ],
    zoom: 18,
    maxZoom: 18,
    minZoom: 16,
    // center: { lat: -23.410618, lng: -51.944181 },
  };

  limparSelecao() {
    if (this.quarteiraoPoligono) {
      this.map.removeLayer(this.quarteiraoPoligono);
    }

    this.limparPoligono();
  }

  desfazerPonto() {
    console.log('teste');
    this.pontosSelecionados.pop();
    if (this.circulos.length > 0) {
      let circulo: any = this.circulos.pop();
      this.map.removeLayer(circulo);

      this.desenhaPolignoQuarteirao();
    }
  }

  desenhaPolignoQuarteirao() {
    if (this.quarteiraoPoligono) {
      this.map.removeLayer(this.quarteiraoPoligono);
    }

    if (this.pontosSelecionados.length >= 3) {
      const quarteiraoCoordinates: Leaflet.LatLngExpression[] =
        this.pontosSelecionados.map((point) =>
          Leaflet.latLng(point.lat, point.lng)
        );
      this.quarteiraoPoligono = Leaflet.polygon(quarteiraoCoordinates, {
        color: 'red',
      }).addTo(this.map);
    }
  }

  limparPoligono() {
    this.pontosSelecionados = [];
    this.circulos.forEach((circle) => this.map.removeLayer(circle));
    this.circulos = [];
    this.quarteiraoPoligono = undefined;
  }

  salvarSelecao() {
    if (!this.quarteiraoPoligono) {
      alert('Seleciona o quarterião!');
      return;
    }

    if (!this.numero) {
      alert('Digite o número do quarterião!');
      return;
    }

    this.quarteiraoPoligono.setStyle({ color: 'green', fillColor: 'green' });

    const texto = Leaflet.marker(
      this.quarteiraoPoligono.getBounds().getCenter(),
      {
        icon: Leaflet.divIcon({
          className: 'text-box',
          iconSize: [30, 30],
          html: `<div style="width: 30px; height: 30px; border-radius: 50%; background-color: orange; opacity: 0.8; display: flex; justify-content: center; align-items: center;">
              <div><p style="margin-top: 15px; font-size: 16px; color: white;">${this.numero}</p></div>
            </div>`,
        }),
        interactive: true,
      }
    );
    texto.on('click', () => {
      const quarteiraoClicado = this.quarteiroes.find(
        (q) => q.marcador === texto
      );
      console.log(`Marcador clicado: ${quarteiraoClicado?.numero}`);
    });

    let quarteirao = new Quarteirao(
      Number(this.numeroQuarteirao),
      this.quarteiraoPoligono,
      texto
    );

    texto.addTo(this.map);

    this.quarteiroes.push(quarteirao);

    this.numeroQuarteirao = '';

    console.log(typeof this.quarteiraoPoligono.getLatLngs());
    this.quarteiraoPoligono.getLatLngs().forEach((ponto) => {
      console.log(ponto.toString());
    });

    this.limparPoligono();
  }

  imprimePoligonos() {
    this.quarteiroes.forEach((quarteirao) => {
      console.log(quarteirao.poligono.getLatLngs());

      console.log(quarteirao.poligono.toGeoJSON());
    });
  }

  onMapReady($event: Leaflet.Map) {
    this.map = $event;
    this.configuracaoEventoClickMapa();

    this.bordasMapa = this.map.getBounds();

    this.map.on('moveend', () => {
      this.bordasMapa = this.map.getBounds();
      console.log('Novos limites da view box:', this.bordasMapa);
    });

    if (this.mapaAtivado) {
      this.map.fitBounds(this.bordasMapa);
    }
  }

  atualizarVisibilidadeMarcadores(zoomLevel: number) {
    const visivel = zoomLevel > 17;

    this.circulos.forEach((circulo) => {
      if (visivel) {
        this.map.addLayer(circulo);
      } else {
        this.map.removeLayer(circulo);
      }
    });

    this.quarteiroes.forEach((quarteirao) => {
      if (quarteirao.marcador) {
        if (visivel) {
          this.map.addLayer(quarteirao.marcador);
        } else {
          this.map.removeLayer(quarteirao.marcador);
        }
      }
    });
  }

  selecionarPoligono(quarteirao: Quarteirao) {
    console.log('Polígono selecionado:', quarteirao.numero);
  }

  configuracaoEventoClickMapa() {
    this.map.on('click', (e) => {
      const latlng = e.latlng;
      console.log(`Clicou em: ${latlng.lat}, ${latlng.lng}`);

      this.pontosSelecionados.push(latlng);

      if (this.quarteiraoPoligono) {
        this.map.removeLayer(this.quarteiraoPoligono);
      }

      const circle = Leaflet.marker(latlng, {
        icon: Leaflet.divIcon({
          className: 'circle-icon',
          iconSize: [20, 20],
          html: '<div style="width: 20px; height: 20px; border-radius: 50%; background-color: blue; opacity: 0.5;"></div>',
        }),
        draggable: true,
      });

      circle.on('drag', (event) => {
        this.circuloMovimentado(event);
      });

      circle.addTo(this.map);

      this.circulos.push(circle);

      if (this.pontosSelecionados.length >= 3) {
        const quarteiraoCoordinates: Leaflet.LatLngExpression[] =
          this.pontosSelecionados.map((point) =>
            Leaflet.latLng(point.lat, point.lng)
          );
        this.quarteiraoPoligono = Leaflet.polygon(quarteiraoCoordinates, {
          color: 'red',
        }).addTo(this.map);
      }
    });
  }

  circuloMovimentado(event: Leaflet.LeafletEvent) {
    this.pontosSelecionados = this.circulos.map((circle) => circle.getLatLng());

    if (this.quarteiraoPoligono) {
      this.map.removeLayer(this.quarteiraoPoligono);
    }

    if (this.pontosSelecionados.length >= 3) {
      const quarteiraoCoordinates: Leaflet.LatLngExpression[] =
        this.pontosSelecionados.map((point) =>
          Leaflet.latLng(point.lat, point.lng)
        );
      this.quarteiraoPoligono = Leaflet.polygon(quarteiraoCoordinates, {
        color: 'red',
      }).addTo(this.map);
    }
  }

  mapaClicado($event: any) {
    console.log($event.latlng.lat, $event.latlng.lng);
  }

  marcarClicado($event: any, index: number) {
    console.log($event.latlng.lat, $event.latlng.lng);
  }

  pesquisarRua() {
    const enderecoBusca = this.enderecoPesquisa
      .toLowerCase()
      .replace(/ /g, '+');
    console.log('Pesquisando a rua:', enderecoBusca);

    this.http.get<any>(`${this.nominatimURL}${enderecoBusca}`).subscribe(
      (data) => {
        if (data && data.length > 0) {
          const result = data[0];

          const streetBounds = Leaflet.latLngBounds(
            Leaflet.latLng(result.boundingbox[0], result.boundingbox[2]),
            Leaflet.latLng(result.boundingbox[1], result.boundingbox[3])
          );

          this.mapaAtivado = true;
          if (this.map) {
            this.map.fitBounds(streetBounds);
          }

          this.map.on('zoomend', () => {
            const zoomLevel = this.map.getZoom();
            this.atualizarVisibilidadeMarcadores(zoomLevel);
          });
        } else {
          console.warn('Nenhum resultado encontrado.');
        }
      },
      (error) => {
        console.error('Erro ao realizar a busca:', error);
      }
    );
  }
}
