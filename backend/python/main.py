
# main.py
# Requisitos:
#   pip install fastapi uvicorn pdfminer.six pydantic

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Tuple
from pdfminer.high_level import extract_text
import io
import re
import json

app = FastAPI(title="Analisador de Exame BRCA1/2 (por referências NM_*)", version="1.1")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou especifique seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Modelos de entrada/saída
# -----------------------------
class MembroFamilia(BaseModel):
    relacao: str   # "avo" | "mae" | "paciente" (pode aceitar outros)
    possui_gene: bool

class AnaliseResponse(BaseModel):
    paciente_tem_genes: bool
    referencias_encontradas: Dict[str, bool]
    bloco_referencias: Optional[str]
    painel_genetico: Dict[str, Any]
    mensagem_informativa: str
    depuracao: Dict[str, Any]

# -----------------------------
# Utilidades
# -----------------------------
def _extrair_texto_pdf(file_bytes: bytes) -> str:
    with io.BytesIO(file_bytes) as bio:
        return extract_text(bio) or ""

def _achar_bloco_sequencias_referencias(texto: str, janela: int = 800) -> Optional[str]:
    """
    Localiza a primeira ocorrência de "Sequências referências" (aceitando variações),
    e extrai um bloco de texto a partir daí (tamanho 'janela'), para inspecionar as referências.
    """
    padrao_hdr = re.compile(r"Sequ[eê]ncias\s+refer[eê]ncias\s*[:\-]?", re.IGNORECASE)
    m = padrao_hdr.search(texto)
    if not m:
        return None
    inicio = m.start()
    fim = min(len(texto), m.end() + janela)
    return texto[inicio:fim]

def _detectar_brca_por_referencia(bloco: Optional[str]) -> Dict[str, bool]:
    """
    Verifica, DENTRO do bloco de 'Sequências referências', se aparecem:
      - NM_007294.4 (BRCA1)   [aceita NM- ou NM_ e .qualquer_subversão]
      - NM_000059.4 (BRCA2)
    """
    if not bloco:
        return {"BRCA1": False, "BRCA2": False}

    padrao_brca1 = re.compile(r"NM[_\-]?007294(?:\.\d+)?\s*\(\s*BRCA1\s*\)", re.IGNORECASE)
    padrao_brca2 = re.compile(r"NM[_\-]?000059(?:\.\d+)?\s*\(\s*BRCA2\s*\)", re.IGNORECASE)

    return {
        "BRCA1": bool(padrao_brca1.search(bloco)),
        "BRCA2": bool(padrao_brca2.search(bloco)),
    }

def _calcular_painel_genetico(membros: List[MembroFamilia]) -> Dict[str, Any]:
    """
    Regra operacional definida por você:
      - 33% por geração que possui o gene (ex.: avó, mãe, paciente).
      - Soma total = 33 * (#gerações com gene), teto ~99%.
    """
    por_geracao = 33
    por_membro: Dict[str, int] = {}
    total = 0
    for m in membros:
        perc = por_geracao if m.possui_gene else 0
        por_membro[m.relacao.lower()] = perc
        total += perc
    return {
        "por_geracao_percent": por_geracao,
        "por_membro": por_membro,
        "total_percent": total
    }

def _gerar_mensagem(paciente_tem_genes: bool,
                    refs: Dict[str, bool],
                    painel: Dict[str, Any],
                    bloco_ref: Optional[str]) -> str:
    partes = []
    partes.append("**Análise do exame (por referências NM em “Sequências referências”)**")

    partes.append(
        f"- Referências detectadas no bloco: BRCA1={'sim' if refs.get('BRCA1') else 'não'}, "
        f"BRCA2={'sim' if refs.get('BRCA2') else 'não'}."
    )
    if paciente_tem_genes:
        partes.append("- Interpretação operacional: **Paciente POSsui os genes** (ambas as referências BRCA1 e BRCA2 presentes na linha/bloco).")
    else:
        partes.append("- Interpretação operacional: **Paciente NÃO possui os genes** (ambas as referências não aparecem juntas no bloco).")

    pm = painel.get("por_membro", {})
    partes.append(
        f"- Painel genético por geração (33% por geração com gene): "
        f"avó={pm.get('avo', 0)}%, mãe={pm.get('mae', 0)}%, paciente={pm.get('paciente', 0)}% "
        f"(total={painel.get('total_percent', 0)}%)."
    )

    partes.append(
        "⚠️ **Observação importante**: Esta lógica segue sua regra operacional — considerar a presença conjunta de "
        "`NM_007294.x (BRCA1)` e `NM_000059.x (BRCA2)` no bloco de “Sequências referências” como indício de que o "
        "paciente “possui os genes”. Não constitui aconselhamento genético ou laudo médico. Valide com o laudo oficial "
        "e com o profissional responsável."
    )

    if bloco_ref:
        # Mostramos um trecho curto do bloco para transparência
        trecho = bloco_ref.strip().replace("\n", " ")
        if len(trecho) > 400:
            trecho = trecho[:400] + "…"
        partes.append(f"- Trecho do bloco analisado: “{trecho}”.")
    return "\n".join(partes)

# -----------------------------
# Endpoint principal
# -----------------------------
@app.post("/analisar-exame", response_model=AnaliseResponse)
async def analisar_exame(
    arquivo: UploadFile = File(..., description="PDF do laudo"),
    membros_familia: Optional[str] = Form(
        default=None,
        description=(
            'JSON opcional com a lista de membros/gerações e se possuem o gene. '
            'Ex.: [{"relacao":"avo","possui_gene":false},{"relacao":"mae","possui_gene":true},{"relacao":"paciente","possui_gene":true}]'
        )
    )
):
    """
    Regras:
      - Ignora 'DETECTADA/NÃO DETECTADA' do texto (pois aparecem como exemplos didáticos no laudo).
      - Procura o bloco de “Sequências referências” e verifica se **ambas** as referências aparecem:
          * NM_007294.x (BRCA1)
          * NM_000059.x (BRCA2)
        Se as duas estiverem lá, => paciente_tem_genes = True; caso contrário, False.
      - Painel genético: 33% para cada geração marcada como 'possui_gene'.
        Se 'membros_familia' não for informado, padrão: avó(false), mãe(false) e paciente(=paciente_tem_genes).
    """
    # Lê PDF
    file_bytes = await arquivo.read()
    texto = _extrair_texto_pdf(file_bytes)

    # Isola o bloco de “Sequências referências”
    bloco = _achar_bloco_sequencias_referencias(texto, janela=1000)
    refs = _detectar_brca_por_referencia(bloco)
    paciente_tem_genes = bool(refs.get("BRCA1") and refs.get("BRCA2"))

    # Monta membros (padrão: avó=false, mãe=false, paciente = conforme detecção)
    if membros_familia:
        try:
            dados = json.loads(membros_familia)
            membros = [MembroFamilia(**d) for d in dados]
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"erro": f"JSON inválido em 'membros_familia': {e}"}
            )
    else:
        membros = [
            MembroFamilia(relacao="avo", possui_gene=False),
            MembroFamilia(relacao="mae", possui_gene=False),
            MembroFamilia(relacao="paciente", possui_gene=paciente_tem_genes),
        ]

    painel = _calcular_painel_genetico(membros)
    mensagem = _gerar_mensagem(
        paciente_tem_genes=paciente_tem_genes,
        refs=refs,
        painel=painel,
        bloco_ref=bloco
    )

    return AnaliseResponse(
        paciente_tem_genes=paciente_tem_genes,
        referencias_encontradas=refs,
        bloco_referencias=bloco.strip() if bloco else None,
        painel_genetico=painel,
        mensagem_informativa=mensagem,
        depuracao={
            "bytes_pdf": len(file_bytes),
            "achou_bloco_sequencias_referencias": bool(bloco is not None),
        }
    )
