import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generateMediaRichReport(htmlContent: string): Promise<string> {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    useCORS: true,
  });

  document.body.removeChild(container);

  const pdf = new jsPDF("p", "mm", "a4");
  const imgData = canvas.toDataURL("image/png");
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  return pdf.output("datauristring");
}
