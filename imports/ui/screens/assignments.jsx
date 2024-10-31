import {
  FileSearchOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { Button, Flex, Input, Select, Space, Table, Typography } from "antd";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GlobalContext } from "../context/globalsContext";
import BatchAssign from "../../api/utils/batchAssign";

export default function Assignments() {
  const navigate = useNavigate();
  const { globals } = useContext(GlobalContext);
  const { state } = useLocation();
  const [reload, setReload] = useState(0);
  const [currentProject, setCurrentProject] = useState({});
  const searchInput = useRef(null);

  const [records, setRecords] = useState([]);
  const [managers, setManagers] = useState([]);
  const [assignedManagers, setAssignedManagers] = useState({});
  const [searchKeys, setSearchKeys] = useState({});

  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
  });

  const [incidences, setIncidences] = useState();
  const voidSorter = { sortField: null, sortOrder: 1 };
    //#region load JSON

    useEffect(() => {
      async function getProjectData() {
        const proyectosStr = await Meteor.callAsync("getTextAssets", "proyectos.json");
        const projects_ = JSON.parse(proyectosStr);
        const currentProject_ = projects_[globals?.project.name];
        setCurrentProject(currentProject_);
      }
      if (globals?.project) getProjectData();
    }, [globals?.project]);
  
    //#endregion

  useEffect(() => {
    if (!state) navigate("/detour");
    getData();
    getManagers();
    getIncidences();
  }, [state, globals, reload, currentProject]);

  useEffect(() => {
    getAssignedManagers();
  }, [records]);

  //#region Get Managers
  function getAssignedManagers() {
    const recordsIds = records.map((record) => record._id);
    Meteor.call(
      "assignment.readRecents",
      null,
      1,
      100,
      { recordId: recordsIds },
      voidSorter,
      (err, resp) => {
        if (err) return;
        resp.data.forEach((data) => {
          if (!data.manager) return;
          setAssignedManagers((prev) => ({
            ...prev,
            ...{ [`${data.recordId}`]: data.manager },
          }));
        });
      }
    );
  }
  //#endregion

  function newAssignment(recordId, manager) {
    Meteor.call("assignment.create", { recordId, manager, date: Date.now() });
    setAssignedManagers((prev) => ({
      ...prev,
      ...{ [`${recordId}`]: manager },
    }));
  }

  async function getIncidences() {
    const inc = await Meteor.callAsync("record.incidences", state?.id, [
      "DESCRIPCION_TIPO_PRODUCTO",
    ]);
    setIncidences(inc);
  }

  //#region Search engine



  const handleSearch = (
    selectedKeys,
    confirm,
    dataIndex,
    sort = voidSorter
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);

    const searchTerm = selectedKeys[0];
    const search = { ...searchKeys, ...{ [dataIndex]: searchTerm } };
    setSearchKeys(search);
    getData(1, pagination.pageSize, search, sort);
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleReset = (clearFilters, dataIndex, confirm) => {
    const search = delete searchKeys[dataIndex];
    clearFilters();
    confirm();
    setSearchText("");
    setSearchedColumn("");
    setSearchKeys(search);
    getData(1, pagination.pageSize, search);
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  function getColumnSearchProps(dataIndex) {
    return {
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
        close,
      }) => {
        return (
          <Flex
            vertical
            gap={5}
            style={{
              padding: 8,
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Input
              ref={searchInput}
              placeholder={`Buscar en: ${dataIndex}`}
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() =>
                handleSearch(selectedKeys, confirm, dataIndex)
              }
              style={{
                marginBottom: 8,
                display: "block",
              }}
            />
            <Space style={{ justifyContent: "space-between" }}>
              <Button
                type="primary"
                onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                icon={<SearchOutlined />}
                size="small"
                style={{
                  width: 90,
                }}
              >
                Busca
              </Button>
              <Button
                onClick={() =>
                  clearFilters && handleReset(clearFilters, dataIndex, confirm)
                }
                size="small"
                style={{
                  width: 90,
                }}
              >
                Reset
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  close();
                }}
              >
                Cerrar
              </Button>
            </Space>
            <Flex vertical align="start">
              <Button
                icon={<SortAscendingOutlined style={{ fontSize: 20 }} />}
                type="link"
                onClick={() =>
                  handleSearch(selectedKeys, confirm, dataIndex, {
                    sortField: dataIndex,
                    sortOrder: 1,
                  })
                }
              >
                Orden ascendente
              </Button>
              <Button
                icon={<SortDescendingOutlined style={{ fontSize: 20 }} />}
                type="link"
                onClick={() =>
                  handleSearch(selectedKeys, confirm, dataIndex, {
                    sortField: dataIndex,
                    sortOrder: -1,
                  })
                }
              >
                Orden descendente
              </Button>
            </Flex>
          </Flex>
        );
      },
      filterIcon: (filtered) =>
        filtered ? <FileSearchOutlined /> : <SearchOutlined />,
      onFilter: (value, record) =>
        record[dataIndex]
          ? record[dataIndex]
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase())
          : false,
      onFilterDropdownOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    };
  }
  //#endregion

  async function getData(page, pageSize, search, sort = voidSorter) {
    const locality = Meteor.user({ profile: 1 })?.profile?.locality;
    Meteor.call(
      "record.read",
      page,
      pageSize,
      {
        ...search,
        timeFrame: state?.id,
        project: globals.project?._id,
        locality,
      },
      sort,
      currentProject?.search,
      (err, res) => {
        if (err) return console.error(err);

        setRecords(res?.data || []);
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: res.total,
        }));
      }
    );
  }
  function handleTableChange(pagination) {
    getData(pagination.current, pagination.pageSize, searchKeys);
    setPagination(pagination);
  }

  function getManagers() {
    // Meteor.call("getManagerList", (err, resp) => setManagers(resp));

    const managers = globals?.members
      ? globals?.members
          .filter((member) => member.position === "manager")
          .map((m) => ({
            label: m.member,
            value: m.member,
            key: m.id,
          }))
      : [];
    setManagers(managers);
  }

  // //#region Temporal table
  // const columns = [
  //   {
  //     title: "Gestor",
  //     dataIndex: "_id",
  //     render: (id) => (
  //       <Select
  //         onChange={(value) => newAssignment(id, value)}
  //         allowClear
  //         value={assignedManagers[id]}
  //         options={managers}
  //         style={{ width: "14rem" }}
  //       />
  //     ),
  //     width: "16rem",
  //   },
  //   {
  //     title: "Número de la orden",
  //     dataIndex: "NUMERO_DE_LA_ORDEN",
  //     width: "8rem",
  //     ...getColumnSearchProps("CONTRATO"),
  //   },
  //   {
  //     title: "Contrato",
  //     dataIndex: "CONTRATO",
  //     width: "8rem",
  //     ...getColumnSearchProps("CONTRATO"),
  //   },
  //   {
  //     title: "Cliente",
  //     dataIndex: "CLIENTE",
  //     width: "8rem",
  //     ...getColumnSearchProps("CLIENTE"),
  //   },
  //   {
  //     title: "Tipo Producto",
  //     dataIndex: "DESCRIPCION_TIPO_PRODUCTO",
  //     width: "8rem",
  //     ...getColumnSearchProps("DESCRIPCION_TIPO_PRODUCTO"),
  //   },
  //   {
  //     title: "Categoría",
  //     dataIndex: "DESCRIPCION_CATEGORIA",
  //     width: 180,
  //     ...getColumnSearchProps("DESCRIPCION_CATEGORIA"),
  //   },
  //   {
  //     title: "Estrato",
  //     dataIndex: "DESCRIPCION_SUBCATEGORIA",
  //     width: 180,
  //     ...getColumnSearchProps("DESCRIPCION_SUBCATEGORIA"),
  //   },
  //   {
  //     title: "Refinanciaciones/año",
  //     dataIndex: "NUMERO_REFINANCIACIONES_ULTIMO_ANO",
  //     width: 180,
  //     ...getColumnSearchProps("NUMERO_REFINANCIACIONES_ULTIMO_ANO"),
  //   },
  //   {
  //     title: "Estado financiero",
  //     dataIndex: "ESTADO_FINANCIERO",
  //     width: 180,
  //     ...getColumnSearchProps("ESTADO_FINANCIERO"),
  //   },
  //   {
  //     title: "Lectura",
  //     dataIndex: "ULTIMA_LECTURA_TOMADA",
  //     width: 180,
  //     ...getColumnSearchProps("ULTIMA_LECTURA_TOMADA"),
  //   },
  //   {
  //     title: "Medidor",
  //     dataIndex: "ELEMENTO_MEDICION",
  //     width: 180,
  //     ...getColumnSearchProps("ELEMENTO_MEDICION"),
  //   },
  //   {
  //     title: "Barrio",
  //     dataIndex: "DESCRIPCION_BARRIO",
  //     width: 180,
  //     ...getColumnSearchProps("DESCRIPCION_BARRIO"),
  //   },
  //   {
  //     title: "Ciclo",
  //     dataIndex: "DESCRIPCION_CICLO",
  //     width: 180,
  //     ...getColumnSearchProps("DESCRIPCION_CICLO"),
  //   },
  //   {
  //     title: "Identificación",
  //     dataIndex: "IDENTIFICACION",
  //     width: 180,
  //     ...getColumnSearchProps("IDENTIFICACION"),
  //   },
  //   {
  //     title: "Titular del servicio",
  //     dataIndex: "NOMBRE_CLIENTE",
  //     width: 180,
  //     ...getColumnSearchProps("NOMBRE_CLIENTE"),
  //   },
  //   {
  //     title: "Dirección",
  //     dataIndex: "DIRECCION_PREDIO",
  //     width: 180,
  //     ...getColumnSearchProps("DIRECCION_PREDIO"),
  //   },
  //   {
  //     title: "Días deuda",
  //     dataIndex: "DIAS_DEUDA_ASIGNACION",
  //     width: 180,
  //     ...getColumnSearchProps("DIAS_DEUDA_ASIGNACION"),
  //   },
  //   {
  //     title: "Saldo vencido",
  //     dataIndex: "CORRIENTE_VENCIDA_ASIGNADA",
  //     width: 180,
  //     ...getColumnSearchProps("CORRIENTE_VENCIDA_ASIGNADA"),
  //   },
  //   {
  //     title: "Refi. Histórico",
  //     dataIndex: "REFINANCIACIONES_PRODUCTO",
  //     width: 180,
  //     ...getColumnSearchProps("REFINANCIACIONES_PRODUCTO"),
  //   },
  //   {
  //     title: "Edad mora actual",
  //     dataIndex: "EDAD_MORA_ACTUAL",
  //     width: 180,
  //     ...getColumnSearchProps("EDAD_MORA_ACTUAL"),
  //   },
  //   {
  //     title: "Total deuda corriente",
  //     dataIndex: "TOTAL_DEUDA_CORRIENTE",
  //     width: 180,
  //     ...getColumnSearchProps("TOTAL_DEUDA_CORRIENTE"),
  //   },
  //   {
  //     title: "Indicador",
  //     dataIndex: "INDICADOR",
  //     width: 180,
  //     ...getColumnSearchProps("INDICADOR"),
  //   },
  //   {
  //     title: "Deuda total asignada",
  //     dataIndex: "DEUDA_TOTAL_ASIGNADA",
  //     width: 180,
  //     ...getColumnSearchProps("DEUDA_TOTAL_ASIGNADA"),
  //   },
  //   {
  //     title: "Comentario",
  //     dataIndex: "COMENTARIO",
  //     width: 180,
  //     ...getColumnSearchProps("COMENTARIO"),
  //   },
  // ];

  //#endregion

  const columns = currentProject?.fields?.map((field) => {
    if (field.type === "select") {
      return {
        title: field.title,
        dataIndex: field.dataIndex,
        render: (id) => (
          <Select
            onChange={(value) => newAssignment(id, value)}
            allowClear
            value={assignedManagers[id]}
            options={managers}
            style={{ width: "14rem" }}
          />
        ),
        width: "16rem",
      };
    } else {
      return {
        title: field.title,
        dataIndex: field.dataIndex,
        width: "8rem",
        ...getColumnSearchProps(field.dataIndex),
      };
    }
  });
  
  return (
    <>
      <Typography.Title>Asignaciones</Typography.Title>
      <Table
        size="small"
        dataSource={records}
        columns={columns}
        rowKey={(data) => data._id}
        scroll={{ y: 55 * 5, x: "max-content" }}
        pagination={{
          ...pagination,
          showTotal: (total) => (
            <>
              <BatchAssign timeFrame={state?.id} setReload={setReload} />
              <Typography.Text
                keyboard
                type="danger"
              >{`${total} Resultados encontrados `}</Typography.Text>
            </>
          ),
          position: ["topLeft"],
        }}
        onChange={handleTableChange}
      />
    </>
  );
}
