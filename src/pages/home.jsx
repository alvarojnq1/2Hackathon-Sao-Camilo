import React, { useRef, useState } from "react";
import logo from "../assets/logo.png";

export default function HomePage() {
    const [cancer, setCancer] = useState("Não");
    const [painel, setPainel] = useState("Não");
    const [pdfFile, setPdfFile] = useState(null);
    const [error, setError] = useState("");
    const [notification, setNotification] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // Novo tópico: Criar Família
    const [criarFamilia, setCriarFamilia] = useState(false); // boolean
    const [familiaNome, setFamiliaNome] = useState("");

    function validatePdf(file) {
        if (!file) return false;
        const isPdfByType = file.type === "application/pdf";
        const isPdfByName = file.name?.toLowerCase().endsWith(".pdf");
        return isPdfByType || isPdfByName;
    }

    function onPdfChange(e) {
        setError("");
        const file = e.target.files?.[0];
        if (!file) return setPdfFile(null);
        if (!validatePdf(file)) {
            setError("Por favor, selecione um arquivo PDF (.pdf).");
            setPdfFile(null);
            return;
        }
        setPdfFile(file);
    }

    function clearPdf() {
        setPdfFile(null);
        setError("");
    }

    function showNotification(message) {
        setNotification(message);
        setTimeout(() => setNotification(""), 2500);
    }

    function handleSaveCancer() {
        localStorage.setItem("diagnostico_cancer", cancer);
        showNotification(`Diagnóstico de Câncer salvo: ${cancer}`);
    }

    function handleSavePainel() {
        if (painel === "Sim" && !pdfFile) {
            setError("Para salvar com 'Sim', adicione um PDF do painel genético.");
            return;
        }
        localStorage.setItem(
            "painel_genetico",
            JSON.stringify({ painel, pdfName: pdfFile ? pdfFile.name : null })
        );
        showNotification(
            painel === "Sim"
                ? `Painel Genético salvo: Sim (${pdfFile?.name || "sem nome"})`
                : "Painel Genético salvo: Não"
        );
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setError("");
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        if (!validatePdf(file)) {
            setError("Apenas PDF é permitido (.pdf).");
            setPdfFile(null);
            return;
        }
        setPdfFile(file);
    }

    function openFilePicker() {
        fileInputRef.current?.click();
    }

    const styles = {
        page: { fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", background: "#f7f7fb", minHeight: "100vh", position: "relative" },
        container: { maxWidth: 900, margin: "0 auto", padding: "24px" },
        navbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "#111827", color: "#fff", position: "sticky", top: 0, zIndex: 10 },
        brand: { display: "flex", alignItems: "center", gap: 12 },
        logo: { height: 40, width: 40, objectFit: "contain", borderRadius: 6 },
        card: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", marginTop: 20 },
        title: { fontSize: 20, fontWeight: 700, marginBottom: 10, color: "#111827" },
        row: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
        radio: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
        hint: { color: "#6b7280", fontSize: 13, marginTop: 6 },
        uploadZone: (active) => ({
            border: `2px dashed ${active ? "#2563eb" : "#d1d5db"}`,
            borderRadius: 12,
            padding: 24,
            background: active ? "#eff6ff" : "#f9fafb",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            gap: 10,
        }),
        fileInfo: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 10, padding: 12, borderRadius: 10, background: "#eef2ff", width: "100%", maxWidth: 480 },
        buttonPrimary: { padding: "10px 14px", borderRadius: 10, border: "1px solid #111827", background: "#111827", color: "#fff", cursor: "pointer" },
        remove: { padding: "8px 12px", borderRadius: 8, border: "1px solid #ef4444", background: "#fff1f2", color: "#b91c1c", cursor: "pointer" },
        error: { color: "#b91c1c", marginTop: 8, fontSize: 14 },
        actionsRow: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" },
        notification: {
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#16a34a",
            color: "white",
            padding: "10px 20px",
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            fontWeight: 600,
            zIndex: 1000,
            transition: "opacity 0.3s ease",
        },
        input: { width: "100%", maxWidth: 480, padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" },
    };

    return (
        <div style={styles.page}>
            {notification && <div style={styles.notification}>✅ {notification}</div>}

            <header style={styles.navbar}>
                <div style={styles.brand}>
                    <img src={logo} alt="Logo" style={styles.logo} />
                    <strong style={{ fontSize: 18 }}>GeneWeb</strong>
                </div>
            </header>

            <main style={styles.container}>
                {/* Diagnóstico de Câncer */}
                <section style={styles.card}>
                    <h2 style={styles.title}>Diagnóstico de Câncer</h2>
                    <div style={styles.row}>
                        <label style={styles.radio}>
                            <input type="radio" name="cancer" value="Sim" checked={cancer === "Sim"} onChange={(e) => setCancer(e.target.value)} />
                            <span>Sim</span>
                        </label>
                        <label style={styles.radio}>
                            <input type="radio" name="cancer" value="Não" checked={cancer === "Não"} onChange={(e) => setCancer(e.target.value)} />
                            <span>Não</span>
                        </label>
                    </div>
                    <p style={styles.hint}>Selecione se o paciente possui diagnóstico confirmado.</p>
                    <div style={styles.actionsRow}>
                        <button type="button" style={styles.buttonPrimary} onClick={handleSaveCancer}>
                            Salvar Diagnóstico
                        </button>
                    </div>
                </section>

                {/* Painel Genético */}
                <section style={styles.card}>
                    <h2 style={styles.title}>Painel Genético</h2>
                    <div style={styles.row}>
                        <label style={styles.radio}>
                            <input type="radio" name="painel" value="Sim" checked={painel === "Sim"} onChange={(e) => setPainel(e.target.value)} />
                            <span>Sim</span>
                        </label>
                        <label style={styles.radio}>
                            <input type="radio" name="painel" value="Não" checked={painel === "Não"} onChange={(e) => setPainel(e.target.value)} />
                            <span>Não</span>
                        </label>
                    </div>
                    <p style={styles.hint}>Informe se existe painel genético disponível.</p>

                    {painel === "Sim" && (
                        <div style={{ marginTop: 16 }}>
                            {!pdfFile ? (
                                <div
                                    style={styles.uploadZone(isDragging)}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>Arraste e solte o PDF aqui</div>
                                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                                        ou <span style={{ textDecoration: "underline" }}>clique</span> para selecionar um arquivo
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        id="pdfUpload"
                                        type="file"
                                        accept="application/pdf,.pdf"
                                        onChange={onPdfChange}
                                        style={{ display: "none" }}
                                    />
                                </div>
                            ) : (
                                <div style={styles.fileInfo}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{pdfFile.name}</div>
                                        <div style={{ fontSize: 12, color: "#374151" }}>{(pdfFile.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                    <button type="button" onClick={clearPdf} style={styles.remove}>
                                        Remover
                                    </button>
                                </div>
                            )}

                            {error && <div style={styles.error}>{error}</div>}
                        </div>
                    )}

                    <div style={styles.actionsRow}>
                        <button type="button" style={styles.buttonPrimary} onClick={handleSavePainel}>
                            Salvar Painel
                        </button>
                    </div>
                </section>

                {/* Criar Família */}
                <section style={styles.card}>
                    <h2 style={styles.title}>Criar Família</h2>

                    <div style={styles.row}>
                        <label style={styles.radio}>
                            <input
                                type="radio"
                                name="criarFamilia"
                                value="true"
                                checked={criarFamilia === true}
                                onChange={() => setCriarFamilia(true)}
                            />
                            <span>Sim</span>
                        </label>

                        <label style={styles.radio}>
                            <input
                                type="radio"
                                name="criarFamilia"
                                value="false"
                                checked={criarFamilia === false}
                                onChange={() => {
                                    setCriarFamilia(false);
                                    setFamiliaNome(""); // limpa o campo quando marcar "Não"
                                }}
                            />
                            <span>Não</span>
                        </label>
                    </div>

                    <p style={styles.hint}>Escolha se deseja criar uma nova família.</p>

                    {criarFamilia && (
                        <div style={{ marginTop: 12 }}>
                            <input
                                type="text"
                                placeholder="Nome da família"
                                value={familiaNome}
                                onChange={(e) => setFamiliaNome(e.target.value)}
                                style={styles.input}
                                autoFocus   // foca automaticamente no campo ao aparecer
                            />
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
