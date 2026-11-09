import os
import zipfile
import xml.sax.saxutils as saxutils

def markdown_to_docx(md_path, docx_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc_xml_body = []
    
    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            doc_xml_body.append('<w:p/>')
            continue
            
        if line.startswith('# '):
            text = saxutils.escape(line[2:].strip())
            p = f'''<w:p>
                <w:pPr>
                    <w:pStyle w:val="Heading1"/>
                    <w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="1E3A8A"/></w:rPr>
                </w:pPr>
                <w:r><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="1E3A8A"/></w:rPr><w:t>{text}</w:t></w:r>
            </w:p>'''
            doc_xml_body.append(p)
        elif line.startswith('## '):
            text = saxutils.escape(line[3:].strip())
            p = f'''<w:p>
                <w:pPr>
                    <w:pStyle w:val="Heading2"/>
                    <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="2563EB"/></w:rPr>
                </w:pPr>
                <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="2563EB"/></w:rPr><w:t>{text}</w:t></w:r>
            </w:p>'''
            doc_xml_body.append(p)
        elif line.startswith('### '):
            text = saxutils.escape(line[4:].strip())
            p = f'''<w:p>
                <w:pPr>
                    <w:pStyle w:val="Heading3"/>
                    <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0F172A"/></w:rPr>
                </w:pPr>
                <w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0F172A"/></w:rPr><w:t>{text}</w:t></w:r>
            </w:p>'''
            doc_xml_body.append(p)
        elif line.startswith('- ') or line.startswith('* '):
            text = saxutils.escape(line[2:].strip())
            p = f'''<w:p>
                <w:pPr>
                    <w:pStyle w:val="ListBullet"/>
                    <w:ind w:left="360"/>
                </w:pPr>
                <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>• {text}</w:t></w:r>
            </w:p>'''
            doc_xml_body.append(p)
        else:
            text = saxutils.escape(line)
            p = f'''<w:p>
                <w:r><w:rPr><w:sz w:val="21"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr><w:t>{text}</w:t></w:r>
            </w:p>'''
            doc_xml_body.append(p)

    document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {''.join(doc_xml_body)}
  </w:body>
</w:document>'''

    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

    with zipfile.ZipFile(docx_path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('word/document.xml', document_xml)

    print(f"Generated Word document successfully: {docx_path}")

if __name__ == '__main__':
    md_file = 'TECHNICAL_DESIGN_DOCUMENT.md'
    docx_file = 'TECHNICAL_DESIGN_DOCUMENT.docx'
    markdown_to_docx(md_file, docx_file)
