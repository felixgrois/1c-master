
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { KBItem } from '../types';

export async function exportKBToWord(item: KBItem) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: item.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'База знаний 1С-МАСТЕР',
                bold: true,
                color: '075985', // sky-800
              }),
            ],
            spacing: { after: 200 },
          }),
          ...item.content
            .replace(/<[^>]*>/g, '\n') // Simple tag stripping
            .split('\n')
            .map(line => {
             const trimmedLine = line.trim();
             if (!trimmedLine) return null; // We'll filter nulls
             
             // Simple detection of headers from markdown
             if (trimmedLine.startsWith('### ')) {
               return new Paragraph({
                 text: trimmedLine.replace('### ', ''),
                 heading: HeadingLevel.HEADING_3,
                 spacing: { before: 200, after: 100 },
               });
             }
             if (trimmedLine.startsWith('## ')) {
               return new Paragraph({
                 text: trimmedLine.replace('## ', ''),
                 heading: HeadingLevel.HEADING_2,
                 spacing: { before: 300, after: 100 },
               });
             }
             if (trimmedLine.startsWith('# ')) {
               return new Paragraph({
                 text: trimmedLine.replace('# ', ''),
                 heading: HeadingLevel.HEADING_1,
                 spacing: { before: 400, after: 150 },
               });
             }

             return new Paragraph({
               children: [
                 new TextRun({
                   text: trimmedLine,
                   size: 24, // 12pt
                 }),
               ],
               spacing: { after: 120 },
             });
          })
          .filter((p): p is Paragraph => p !== null),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${item.title || 'article'}.docx`);
}
