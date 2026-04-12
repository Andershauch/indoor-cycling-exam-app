from __future__ import annotations

import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def read_shared_strings(workbook: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in workbook.namelist():
        return []

    root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
    return [
        "".join(text.text or "" for text in item.findall(".//m:t", NS))
        for item in root.findall("m:si", NS)
    ]


def resolve_sheet_target(workbook: zipfile.ZipFile, sheet_name: str) -> str:
    workbook_xml = ET.fromstring(workbook.read("xl/workbook.xml"))
    relationships = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
    relationship_map = {
        rel.attrib["Id"]: rel.attrib["Target"].lstrip("/")
        for rel in relationships
    }

    for sheet in workbook_xml.find("m:sheets", NS):
        if sheet.attrib.get("name") == sheet_name:
            relationship_id = sheet.attrib[f"{{{NS['r']}}}id"]
            return relationship_map[relationship_id]

    raise SystemExit(f"Arket '{sheet_name}' blev ikke fundet i workbook.")


def read_sheet_rows(workbook_path: Path, sheet_name: str) -> list[dict[str, str]]:
    with zipfile.ZipFile(workbook_path) as workbook:
        shared_strings = read_shared_strings(workbook)
        target = resolve_sheet_target(workbook, sheet_name)
        sheet_xml = ET.fromstring(workbook.read(target))
        rows: list[dict[str, str]] = []

        for row in sheet_xml.findall(".//m:sheetData/m:row", NS):
            values: dict[str, str] = {}

            for cell in row.findall("m:c", NS):
                reference = cell.attrib.get("r", "")
                column = "".join(character for character in reference if character.isalpha())
                cell_type = cell.attrib.get("t")
                inline_value = cell.find("m:is", NS)
                value = ""

                if inline_value is not None:
                    value = "".join(
                        text.text or "" for text in inline_value.findall(".//m:t", NS)
                    )
                else:
                    raw_value = cell.find("m:v", NS)
                    if raw_value is not None:
                        value = raw_value.text or ""
                        if cell_type == "s" and value.isdigit():
                            value = shared_strings[int(value)]

                values[column] = value.strip()

            rows.append(values)

    return rows


def build_import_payload(rows: list[dict[str, str]]) -> dict[str, object]:
    questions = []

    for row in rows[1:]:
        if not row.get("A"):
            continue

        question_number = int(row["A"])
        question_text = row.get("B", "").strip()
        correct_label = row.get("H", "").strip().upper()

        if not question_text or correct_label not in {"A", "B", "C"}:
            continue

        options = []
        for label, column in [("A", "C"), ("B", "D"), ("C", "E")]:
            option_text = row.get(column, "").strip()
            if not option_text:
                continue

            options.append(
                {
                    "label": label,
                    "text": option_text,
                    "isCorrect": label == correct_label,
                }
            )

        questions.append(
            {
                "externalKey": f"indoor-cycling-opdateret-{question_number:03d}",
                "questionNumber": question_number,
                "category": None,
                "questionText": question_text,
                "explanation": row.get("I", "").strip() or None,
                "sourceReference": "indoor_cycling_proeve_opdateret.xlsx",
                "options": options,
            }
        )

    return {
        "examSet": {
            "slug": "indoor-cycling-proeve-opdateret",
            "title": "Indoor Cycling Prøve",
            "description": "Opdateret prøve importeret fra indoor_cycling_proeve_opdateret.xlsx",
            "version": 2,
            "timeLimitMinutes": 30,
            "passPercentage": 75,
        },
        "questions": questions,
    }


def main() -> int:
    if len(sys.argv) < 3:
        print("Brug: python scripts/convert-exam-xlsx.py <input.xlsx> <output.json>")
        return 1

    workbook_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    rows = read_sheet_rows(workbook_path, "Spørgsmål")
    payload = build_import_payload(rows)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Konverteret {len(payload['questions'])} spørgsmål til {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
