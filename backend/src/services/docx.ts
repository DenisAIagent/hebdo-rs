import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export async function generateDocx(params: {
  title: string;
  author: string;
  content: string;
  paperType: string;
}): Promise<Buffer> {
  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      text: params.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
    })
  );

  // Author + type
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Par ${params.author} — ${params.paperType}`,
          italics: true,
          size: 22,
          color: '666666',
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Separator
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: '—'.repeat(40), color: 'CCCCCC' })],
      spacing: { after: 200 },
    })
  );

  // Body: split by double newlines for paragraphs
  const bodyParagraphs = params.content.split(/\n\n+/);
  for (const para of bodyParagraphs) {
    if (!para.trim()) continue;
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: para.trim(),
            size: 24,
            font: 'Georgia',
          }),
        ],
        spacing: { after: 200, line: 360 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
