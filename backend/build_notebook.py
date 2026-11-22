"""Convert restoration_fusion_backend.py (with '# %%' cell markers) into a Colab .ipynb.
Usage: python build_notebook.py
"""
import json, re, pathlib

here = pathlib.Path(__file__).parent
src = (here / "restoration_fusion_backend.py").read_text()
parts = re.split(r"^# %%(?: \[markdown\])?\n", src, flags=re.M)
heads = re.findall(r"^# %%( \[markdown\])?\n", src, flags=re.M)

cells = []
for head, body in zip(heads, parts[1:]):
    body = body.rstrip("\n")
    if head:
        lines = [l[2:] if l.startswith("# ") else l.lstrip("#") for l in body.split("\n")]
        cells.append({"cell_type": "markdown", "metadata": {}, "source": [l + "\n" for l in lines][:-1] + [lines[-1]]})
    else:
        lines = body.split("\n")
        cells.append({"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [],
                      "source": [l + "\n" for l in lines][:-1] + [lines[-1]]})

nb = {"cells": cells, "nbformat": 4, "nbformat_minor": 5,
      "metadata": {"accelerator": "GPU", "colab": {"provenance": []},
                   "kernelspec": {"display_name": "Python 3", "name": "python3"}, "language_info": {"name": "python"}}}
out = here / "restoration_fusion_backend.ipynb"
out.write_text(json.dumps(nb, indent=1))
print(f"wrote {out} with {len(cells)} cells")
