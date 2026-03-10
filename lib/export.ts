import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import type { GeneratedResume } from "@/types";

export async function exportToPDF(resume: GeneratedResume): Promise<void> {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const addText = (
    text: string,
    fontSize: number,
    bold: boolean = false,
    spacing: number = 6
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += spacing;
    }
  };

  const addSection = (title: string, content: string) => {
    if (!content || !content.trim()) return;
    y += 4;
    addText(title.toUpperCase(), 12, true, 7);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
    y += 2;
    const paragraphs = content.split("\n").filter((p) => p.trim());
    for (const p of paragraphs) {
      addText(p.trim(), 10, false, 5);
    }
    y += 3;
  };

  const s = resume.sections;

  // Header
  if (s.header) {
    addText(s.header, 14, true, 7);
    y += 3;
  }

  addSection("Professional Summary", s.summary);
  addSection("Experience", s.experience);
  addSection("Technical Skills", s.skills);
  addSection("Education", s.education);
  addSection("Projects", s.projects);
  addSection("Courses", s.courses);
  addSection("Certifications", s.certifications);

  doc.save("optimized-resume.pdf");
}

export async function exportToDOCX(resume: GeneratedResume): Promise<void> {
  const children: InstanceType<typeof Paragraph>[] = [];

  const addHeading = (text: string) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: text.toUpperCase(),
            bold: true,
            size: 26,
            color: "4F46E5",
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      })
    );
  };

  const addParagraphs = (content: string) => {
    const paragraphs = content.split("\n").filter((p) => p.trim());
    for (const p of paragraphs) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: p.trim(),
              size: 22,
            }),
          ],
          spacing: { after: 80 },
        })
      );
    }
  };

  const addSection = (title: string, content: string) => {
    if (!content || !content.trim()) return;
    addHeading(title);
    addParagraphs(content);
  };

  const s = resume.sections;

  // Header
  if (s.header) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: s.header, bold: true, size: 28 }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  addSection("Professional Summary", s.summary);
  addSection("Experience", s.experience);
  addSection("Technical Skills", s.skills);
  addSection("Education", s.education);
  addSection("Projects", s.projects);
  addSection("Courses", s.courses);
  addSection("Certifications", s.certifications);

  const docFile = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(docFile);
  saveAs(blob, "optimized-resume.docx");
}
