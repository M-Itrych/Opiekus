"use client";

import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer";

// Register Polish fonts
Font.register({
    family: "Roboto",
    fonts: [
        {
            src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
            fontWeight: "normal",
        },
        {
            src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
            fontWeight: "bold",
        },
    ],
});

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#ffffff",
        padding: 40,
        fontFamily: "Roboto",
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 3,
        borderBottomColor: "#0ea5e9",
        paddingBottom: 20,
    },
    logo: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#0ea5e9",
        marginBottom: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#18181b",
        marginTop: 10,
    },
    subtitle: {
        fontSize: 11,
        color: "#71717a",
        marginTop: 5,
    },
    section: {
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#18181b",
        marginBottom: 12,
        backgroundColor: "#f4f4f5",
        padding: 8,
        borderRadius: 4,
    },
    row: {
        flexDirection: "row",
        marginBottom: 6,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#f4f4f5",
    },
    label: {
        fontSize: 10,
        color: "#52525b",
        width: "40%",
    },
    value: {
        fontSize: 10,
        color: "#18181b",
        width: "60%",
    },
    statCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#f0f9ff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    statLabel: {
        fontSize: 10,
        color: "#0369a1",
    },
    statValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0ea5e9",
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#0ea5e9",
        padding: 8,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    tableHeaderCell: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#ffffff",
        flex: 1,
    },
    tableRow: {
        flexDirection: "row",
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e4e4e7",
    },
    tableRowAlt: {
        backgroundColor: "#fafafa",
    },
    tableCell: {
        fontSize: 9,
        color: "#3f3f46",
        flex: 1,
    },
    statusAccepted: {
        color: "#16a34a",
        fontWeight: "bold",
    },
    statusPending: {
        color: "#d97706",
        fontWeight: "bold",
    },
    statusRejected: {
        color: "#dc2626",
        fontWeight: "bold",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#e4e4e7",
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: "#a1a1aa",
    },
    paragraph: {
        fontSize: 10,
        color: "#3f3f46",
        lineHeight: 1.6,
        marginBottom: 8,
    },
    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 20,
    },
    summaryCard: {
        width: "48%",
        backgroundColor: "#f4f4f5",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    summaryCardTitle: {
        fontSize: 9,
        color: "#71717a",
        marginBottom: 4,
    },
    summaryCardValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#18181b",
    },
    childCard: {
        backgroundColor: "#fafafa",
        borderRadius: 6,
        padding: 10,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: "#0ea5e9",
    },
    childName: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#18181b",
        marginBottom: 4,
    },
    childGroup: {
        fontSize: 9,
        color: "#71717a",
    },
    consentRow: {
        flexDirection: "row",
        marginTop: 6,
    },
    consentBadge: {
        fontSize: 8,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        marginRight: 6,
    },
    consentAccepted: {
        backgroundColor: "#dcfce7",
        color: "#16a34a",
    },
    consentRejected: {
        backgroundColor: "#fee2e2",
        color: "#dc2626",
    },
});

interface ReportData {
    title: string;
    content: string;
    reportType: string;
    createdAt: string;
    author: {
        name: string;
        surname: string;
    };
}

// Parse markdown content into sections
function parseReportContent(content: string) {
    const lines = content.split("\n");
    const sections: { title: string; items: string[] }[] = [];
    let currentSection: { title: string; items: string[] } | null = null;

    for (const line of lines) {
        if (line.startsWith("## ")) {
            if (currentSection) sections.push(currentSection);
            currentSection = { title: line.replace("## ", ""), items: [] };
        } else if (line.startsWith("### ")) {
            if (currentSection) {
                currentSection.items.push("__SUBSECTION__" + line.replace("### ", ""));
            }
        } else if (line.startsWith("- ") && currentSection) {
            currentSection.items.push(line.replace("- ", ""));
        } else if (line.trim() && currentSection && !line.startsWith("#")) {
            currentSection.items.push(line);
        }
    }
    if (currentSection) sections.push(currentSection);

    return sections;
}

// Generic report document
const ReportDocument = ({ report }: { report: ReportData }) => {
    const sections = parseReportContent(report.content);
    const reportDate = new Date(report.createdAt).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            rodo: "Raport RODO",
            obecnosc: "Raport Obecności",
            finansowy: "Raport Finansowy",
            statystyki: "Statystyki Przedszkola",
        };
        return labels[type.toLowerCase()] || type;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>Opiekus</Text>
                    <Text style={styles.title}>{report.title}</Text>
                    <Text style={styles.subtitle}>
                        {getTypeLabel(report.reportType)} • Wygenerowano: {reportDate}
                    </Text>
                    <Text style={styles.subtitle}>
                        Autor: {report.author.name} {report.author.surname}
                    </Text>
                </View>

                {/* Content sections */}
                {sections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.items.map((item, itemIndex) => {
                            if (item.startsWith("__SUBSECTION__")) {
                                return (
                                    <View key={itemIndex} style={styles.childCard}>
                                        <Text style={styles.childName}>
                                            {item.replace("__SUBSECTION__", "")}
                                        </Text>
                                    </View>
                                );
                            }

                            // Check for key-value pairs
                            if (item.includes(":")) {
                                const [label, ...valueParts] = item.split(":");
                                const value = valueParts.join(":").trim();

                                // Handle consent status with colors
                                let valueStyle = styles.value;
                                if (value.includes("✅") || value.includes("TAK")) {
                                    valueStyle = { ...styles.value, ...styles.statusAccepted };
                                } else if (value.includes("❌") || value.includes("NIE")) {
                                    valueStyle = { ...styles.value, ...styles.statusRejected };
                                } else if (value.includes("⏳")) {
                                    valueStyle = { ...styles.value, ...styles.statusPending };
                                }

                                return (
                                    <View key={itemIndex} style={styles.row}>
                                        <Text style={styles.label}>{label.replace(/[✅❌⏳]/g, "").trim()}</Text>
                                        <Text style={valueStyle}>{value.replace(/[✅❌⏳]/g, "").trim()}</Text>
                                    </View>
                                );
                            }

                            return (
                                <Text key={itemIndex} style={styles.paragraph}>
                                    {item.replace(/[✅❌⏳]/g, "")}
                                </Text>
                            );
                        })}
                    </View>
                ))}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Opiekus - System Zarządzania Przedszkolem
                    </Text>
                    <Text style={styles.footerText}>
                        Dokument wygenerowany automatycznie
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

// Function to generate and download PDF
export async function generateReportPDF(report: ReportData): Promise<Blob> {
    const blob = await pdf(<ReportDocument report={report} />).toBlob();
    return blob;
}

export async function downloadReportPDF(report: ReportData) {
    const blob = await generateReportPDF(report);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, "")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default ReportDocument;
