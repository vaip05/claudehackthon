#!/usr/bin/env python3
"""Generates public/demo/sample-hormone-panel.pdf: a one-page FAKE lab report for demos.

Every value is invented. Testosterone and AMH are above range and LH:FSH is above 2:1;
thyroid, prolactin, glucose and insulin are normal. A diagonal "SAMPLE - NOT REAL"
watermark is drawn on the page. No dependencies: writes the PDF by hand.

    python3 scripts/make-sample-report.py
"""
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'demo', 'sample-hormone-panel.pdf')

# (test, result, units, reference range, flag)
ROWS = [
    ('Testosterone, total', '92', 'ng/dL', '15 - 70', 'HIGH'),
    ('SHBG', '24', 'nmol/L', '18 - 144', ''),
    ('DHEA-S', '310', 'ug/dL', '35 - 430', ''),
    ('Anti-Mullerian hormone (AMH)', '7.8', 'ng/mL', '1.0 - 4.0', 'HIGH'),
    ('LH', '15.6', 'IU/L', '1.9 - 12.5', 'HIGH'),
    ('FSH', '5.2', 'IU/L', '3.5 - 12.5', ''),
    ('LH:FSH ratio (calculated)', '3.0 : 1', '', 'below 2 : 1', 'HIGH'),
    ('TSH', '2.1', 'mIU/L', '0.4 - 4.0', ''),
    ('Prolactin', '11', 'ng/mL', '4 - 25', ''),
    ('Glucose, fasting', '91', 'mg/dL', '70 - 99', ''),
    ('Insulin, fasting', '13', 'uIU/mL', '2 - 19', ''),
]

COLS = [50, 262, 332, 402, 506]  # x positions: test, result, units, range, flag
GRAY, DARK, RED, BLUE = '0.45 g', '0.1 g', '0.78 0.1 0.15 rg', '0.35 0.2 0.55 rg'


def esc(text: str) -> str:
    return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def text(x, y, size, s, font='F1', color='0.1 g') -> str:
    return f'BT /{font} {size} Tf {color} {x} {y} Td ({esc(s)}) Tj ET\n'


def build_page() -> str:
    c = []
    # Watermark first so the report text stays on top and readable.
    c.append('q 0.9 g BT /F2 50 Tf 0.819 0.574 -0.574 0.819 85 200 Tm (SAMPLE - NOT REAL) Tj ET Q\n')

    c.append(text(50, 735, 20, 'Example Diagnostics Laboratory', 'F2', BLUE))
    c.append(text(50, 718, 10, 'Hormone & Metabolic Panel  |  FICTIONAL REPORT FOR SOFTWARE DEMO', 'F1', GRAY))
    c.append('0.35 0.2 0.55 RG 1.2 w 50 708 m 562 708 l S\n')

    c.append(text(50, 686, 10, 'Patient:', 'F2') + text(100, 686, 10, 'Jane Sample (fictional)'))
    c.append(text(50, 670, 10, 'Age / Sex:', 'F2') + text(110, 670, 10, '27 / F'))
    c.append(text(330, 686, 10, 'Collected:', 'F2') + text(390, 686, 10, '2026-10-14 (cycle day 4)'))
    c.append(text(330, 670, 10, 'Reported:', 'F2') + text(390, 670, 10, '2026-10-15'))

    y = 632
    c.append('0.93 0.9 0.96 rg 50 %d 512 20 re f\n' % (y - 6))
    for x, label in zip(COLS, ['TEST', 'RESULT', 'UNITS', 'REFERENCE RANGE', 'FLAG']):
        c.append(text(x + 4, y, 9, label, 'F2', '0.25 g'))
    y -= 26
    for test, result, units, ref, flag in ROWS:
        high = flag == 'HIGH'
        c.append(text(COLS[0] + 4, y, 10.5, test, 'F2' if high else 'F1'))
        c.append(text(COLS[1] + 4, y, 10.5, result, 'F2' if high else 'F1', RED if high else '0.1 g'))
        c.append(text(COLS[2] + 4, y, 10.5, units, 'F1', '0.3 g'))
        c.append(text(COLS[3] + 4, y, 10.5, ref, 'F1', '0.3 g'))
        if high:
            c.append(text(COLS[4] + 4, y, 10.5, flag, 'F2', RED))
        c.append('0.85 G 0.5 w 50 %d m 562 %d l S\n' % (y - 8, y - 8))
        y -= 26

    y -= 6
    c.append(text(50, y, 9, 'Reference ranges are for early follicular phase (cycle days 2-5). Ranges vary by laboratory.', 'F1', GRAY))
    c.append(text(50, 62, 9, 'FICTIONAL DATA created for a software demonstration. Not a real patient, laboratory, or medical report.', 'F2', RED))
    c.append(text(50, 48, 9, 'Do not use for any medical purpose.', 'F1', GRAY))
    return ''.join(c)


def write_pdf(path: str) -> None:
    stream = build_page()
    objs = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R '
        '/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
        f'<< /Length {len(stream)} >>\nstream\n{stream}endstream',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ]
    out = '%PDF-1.4\n'
    offsets = []
    for i, body in enumerate(objs, 1):
        offsets.append(len(out))
        out += f'{i} 0 obj\n{body}\nendobj\n'
    xref = len(out)
    out += f'xref\n0 {len(objs) + 1}\n0000000000 65535 f \n'
    out += ''.join(f'{o:010d} 00000 n \n' for o in offsets)
    out += f'trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(out.encode('ascii'))


if __name__ == '__main__':
    write_pdf(OUT)
    print('wrote', os.path.normpath(OUT))
