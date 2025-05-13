const MyComponent = ({ InnerComponent }) => {
  return (
    <div>
      <h2>Componente Dinámico</h2>
      <InnerComponent />
      <p>
        Este componente ha sido cargado dinámicamente desde la carpeta
        `private`.
      </p>
    </div>
  );
};

MyComponent;
