import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { AngularFireStorage } from '@angular/fire/compat/storage';


@Component({
  selector: 'app-agregar-compra',
  templateUrl: './agregar-compra.component.html'
})

export class AgregarCompraComponent {
  documentoField: any;
  clientFoundTag: boolean = false;
  clientFound: any;
  selectedModeloDispositivo: any;
  selectedMarcaDispositivo: any;
  selectedFile: string | ArrayBuffer | null = null; // Adjust type to File | null
  firebaseFile: File | null = null;
  fireStorage: AngularFireStorage;
  modelosDispositivos: any[] = [];
  marcasDispositivos: any[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private storage: AngularFireStorage
  ) { }

  //* Estructura para Formulario Compras
  public compraForm = {
    imei: '',
    marca_telefono: '',
    procedencia: '',
    modelo_dispositivo: '',
    descripcion: '',
    valor_compra: 0
  };

  //* Estructura para Busqueda Cliente
  doc = '';
  public clienteEncontrado = {
    nombre: '',
    tipo_documento: '',
    documento: '',
    direccion: '',
    telefono: '',
  };

  ngOnInit(): void {
    this.obtenerModelosDispositivos();
    this.obtenerMarcasDispositivos();
  }

  obtenerModelosDispositivos(): void {
    const url = 'https://back-unisoft-lnv0.onrender.com/modelo/modelo_dispositivo';
    this.http.get<any[]>(url)
      .subscribe((data: any[]) => {
        this.modelosDispositivos = data;
        console.log('Modelos de dispositivos:', this.modelosDispositivos);
      });
  }

  obtenerMarcasDispositivos(): void {
    const url = 'https://back-unisoft-lnv0.onrender.com/marca/marca_dispositivo';
    this.http.get<any[]>(url)
      .subscribe((data: any[]) => {
        this.marcasDispositivos = data;
        console.log('Marcas de dispositivos:', this.marcasDispositivos);
      });
  }

  async addCompra(form: any) {
    const data: any = {};
    if (!form.value.imei || !form.value.marca_dispositivo || !form.value.consecutivo || !form.value.modelo_dispositivo || !form.value.valor_compra
        || !this.selectedMarcaDispositivo || !this.selectedModeloDispositivo
    ) {
      // Show Swal fire alert if any field is empty
      Swal.fire({
        title: 'Debe rellenar todos los campos',
        text: '',
        icon: 'warning',
        confirmButtonText: 'OK',
      });

      return;
    } else if (!this.clientFound) {
      Swal.fire({
        title: 'Debe buscar el cliente',
        text: '',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
    } else {

      // if (this.firebaseFile) {
      //   const file: File = this.firebaseFile as File;
      //   const path = `docs/${form.value.imei}`;
      //   this.fireStorage.upload(path, file);
      //   const uploadTask = await this.fireStorage.upload(path, file);
      //   const url = await uploadTask.ref.getDownloadURL();
      //   console.log(url);
      //   data.foto_documento = url;
      // }

      // Set other client data
      data.imei = form.value.imei;
      data.consecutivo_compraventa = form.value.consecutivo;
      data.observacion = form.value.observacion;
      data.valor_compra = form.value.valor_compra;
      data.modelo_dispositivo = this.selectedModeloDispositivo;
      // data.modelo_dispositivo = 1;
      data.marca_dispositivo = this.selectedMarcaDispositivo;
      // data.marca_dispositivo = 12;
      data.cliente_id = this.clientFound.oid;
      data.valor_venta = '0';
      data.fecha_hora = '0';
      // TODO Revisar los campos y averiguar como concatenar info dispositivo + info cliente en un mismo paquete de datos
      // Post client data to the server
      this.http
        .post<any>(
          'https://back-unisoft-lnv0.onrender.com/compra/compras_inventario/nueva_compra',
          data
        )
        .subscribe(
          (response) => {
            Swal.fire({
              title: 'La compra se ha realizado con éxito',
              text: '',
              icon: 'success',
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(['/inventario/ver-inventario']);
              }
            });
          },
          (error) => {
            // Handle error response
            console.error('Error añadiendo la compra: ', error);
            Swal.fire({
              title: 'Error',
              text: 'Error creando la compra',
              icon: 'error',
              confirmButtonText: 'OK',
            });
          }
        );
    }
  }

  //* Subida de Formato CompraVenta
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFile = e.target.result;
        this.firebaseFile = file;
      };
      reader.readAsDataURL(file);
    }
  }

  deleteSelectedPhoto() {
    this.selectedFile = null;
  }

  //* Gestión Tabla
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['IMEI', 'Marca de Teléfono', 'Procedencia', 'Modelo del Teléfono', 'Detalles del Teléfono', 'Valor de Compra'];
  DATA: any[] = []

  addFila(form: any) {
    this.compraForm = form.value;
    const newData = this.DATA
    newData.push(this.compraForm);

    this.dataSource.data = [...newData];
    console.log('Formulario Captado:', this.compraForm);
    console.log('Data Source Cargado', this.dataSource.data);
  };

  //Gestión GET Cliente
  getCliente(documento: string) {
    const endpoint = `https://back-unisoft-1.onrender.com/cliente/listaClientes/documento/${documento}`;
    this.http.get(endpoint).subscribe(
      (response: any) => {
        // Handle the response here
        this.clientFound = response[0];
        this.doc = documento;
        this.clientFoundTag = true;
        console.log('response', response);
        this.clienteEncontrado.documento = response[0].documento;
        this.clienteEncontrado.nombre = response[0].nombre;
        this.clienteEncontrado.direccion = response[0].direccion;
        this.clienteEncontrado.telefono = response[0].telefono;
      }, (error) => {
        // Handle errors here
        console.error(error);
        Swal.fire({
          title: 'Advertencia',
          text: 'Cliente no encontrado',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
      }
    );
  }
}
