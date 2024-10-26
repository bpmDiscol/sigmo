import * as XLSX from "xlsx";

export default function processExcel(file, cb) {
  cb({
    status: "processing",
    data: null,
  });
  console.warn("processing...");
  new Promise(() => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      const data = reader.result;
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonSheet = XLSX.utils.sheet_to_json(ws);

      cb((prev) => {
        return {
          ...prev,
          status: "processed",
          data: jsonSheet,
          length: jsonSheet.length,
        };
      });
    };
  });
}
