import * as Leaflet from 'leaflet';

export class Quarteirao {
  // id: number;
  numero: number;
  // localidade: Localidade = new Localidade();
  selecionado: boolean = false;
  poligono: Leaflet.Polygon;
  marcador: Leaflet.Marker;

  constructor(
    numero: number,
    poligono: Leaflet.Polygon,
    marcador: Leaflet.Marker
  ) {
    this.numero = numero;
    this.poligono = poligono;
    this.marcador = marcador;
  }
}
