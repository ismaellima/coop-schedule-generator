import { Document, Page, View, Text, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import type { WeekAssignment } from "../lib/types";

const FLOOR_KEYS = ["sous-sol", "rez-de-chaussee", "1er-etage"] as const;

const FLOOR_LABELS_PDF: Record<string, string[]> = {
  "sous-sol": ["Sous-sol"],
  "rez-de-chaussee": ["Rez de chaussée &", "vitres de l'entrée"],
  "1er-etage": ["1er étage"],
};

const BALAYEUSE_KEY: Record<string, keyof WeekAssignment> = {
  "sous-sol": "balayeuseSousSol",
  "rez-de-chaussee": "balayeuseRezDeChaussee",
  "1er-etage": "balayeuse1erEtage",
};

// Dynamic styles based on number of weeks
function getStyles(weekCount: number) {
  const totalRows = weekCount * 3;
  const availableHeight = 640;
  const rowHeight = Math.min(28, Math.floor(availableHeight / totalRows));
  const fontSize = rowHeight >= 24 ? 10 : rowHeight >= 20 ? 9 : 8;

  return StyleSheet.create({
    page: {
      padding: 30,
      paddingTop: 25,
      paddingBottom: 25,
      fontSize: fontSize,
      fontFamily: "Helvetica",
    },
    header: {
      marginBottom: 10,
      paddingBottom: 6,
    },
    title: {
      fontSize: 16,
      textAlign: "center",
      fontWeight: "bold",
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 11,
      textAlign: "center",
      color: "#666",
    },
    table: {
      width: "100%",
      borderWidth: 1,
      borderColor: "#000",
    },
    headerRow: {
      flexDirection: "row",
      backgroundColor: "#f5f5f5",
      borderBottomWidth: 1,
      borderColor: "#000",
      height: 22,
    },
    headerCell: {
      fontWeight: "bold",
      padding: 4,
      textAlign: "center",
      fontSize: fontSize,
      justifyContent: "center",
    },
    weekRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: "#999",
      height: rowHeight * 3,
    },
    weekRowLast: {
      borderBottomWidth: 0,
    },
    cellDate: {
      width: "12%",
      borderRightWidth: 1,
      borderColor: "#ddd",
      justifyContent: "center",
      alignItems: "center",
      padding: 4,
    },
    floorRowsContainer: {
      width: "46%",
      borderRightWidth: 1,
      borderColor: "#ddd",
    },
    floorRow: {
      flexDirection: "row",
      height: rowHeight,
      borderBottomWidth: 1,
      borderColor: "#eee",
    },
    floorRowLast: {
      borderBottomWidth: 0,
    },
    cellFloor: {
      width: "48%",
      padding: 3,
      justifyContent: "center",
      borderRightWidth: 1,
      borderColor: "#eee",
    },
    cellBalayeuse: {
      width: "52%",
      padding: 3,
      justifyContent: "center",
      alignItems: "center",
    },
    cellVadAvant: {
      width: "21%",
      borderRightWidth: 1,
      borderColor: "#ddd",
      justifyContent: "center",
      alignItems: "center",
      padding: 4,
    },
    cellVadArriere: {
      width: "21%",
      justifyContent: "center",
      alignItems: "center",
      padding: 4,
    },
    dateText: {
      fontWeight: "bold",
      fontSize: fontSize + 1,
      textAlign: "center",
    },
    floorText: {
      fontSize: fontSize - 1,
      lineHeight: 1.2,
    },
    nameText: {
      fontSize: fontSize,
      textAlign: "center",
    },
    nameWithSignature: {
      alignItems: "center",
      justifyContent: "center",
    },
    signatureRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },
    signatureLine: {
      width: 36,
      borderBottomWidth: 1,
      borderBottomColor: "#999",
      height: 6,
    },
    pencilIcon: {
      width: 8,
      height: 8,
      marginRight: 3,
    },
  });
}

interface Props {
  title: string;
  weeks: WeekAssignment[];
}

export function SchedulePDF({ title, weeks }: Props) {
  const s = getStyles(weeks.length);

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Horaire de ménage</Text>
          <Text style={s.subtitle}>{title}</Text>
        </View>

        {/* Table */}
        <View style={s.table}>
          {/* Table Header */}
          <View style={s.headerRow}>
            <View style={[s.headerCell, { width: "12%" }]}>
              <Text>Date</Text>
            </View>
            <View style={[s.headerCell, { width: "22%" }]}>
              <Text>Étage</Text>
            </View>
            <View style={[s.headerCell, { width: "24%" }]}>
              <Text>Balayeuse</Text>
            </View>
            <View style={[s.headerCell, { width: "21%" }]}>
              <Text>Vadrouille avant</Text>
            </View>
            <View style={[s.headerCell, { width: "21%" }]}>
              <Text>Vadrouille arrière</Text>
            </View>
          </View>

          {/* Week Rows */}
          {weeks.map((week, wi) => {
            const isLastWeek = wi === weeks.length - 1;

            return (
              <View
                key={wi}
                style={isLastWeek ? [s.weekRow, s.weekRowLast] : s.weekRow}
              >
                {/* Date - merged cell */}
                <View style={s.cellDate}>
                  <Text style={s.dateText}>{week.date}</Text>
                </View>

                {/* Floor + Balayeuse rows */}
                <View style={s.floorRowsContainer}>
                  {FLOOR_KEYS.map((floor, fi) => (
                    <View
                      key={floor}
                      style={fi === 2 ? [s.floorRow, s.floorRowLast] : s.floorRow}
                    >
                      <View style={s.cellFloor}>
                        {FLOOR_LABELS_PDF[floor].map((line, i) => (
                          <Text key={i} style={s.floorText}>{line}</Text>
                        ))}
                      </View>
                      <View style={s.cellBalayeuse}>
                        <View style={s.nameWithSignature}>
                          <Text style={s.nameText}>{week[BALAYEUSE_KEY[floor]]}</Text>
                          <View style={s.signatureRow}>
                            <Svg style={s.pencilIcon} viewBox="0 0 24 24">
                              <Path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" fill="#999" />
                            </Svg>
                            <View style={s.signatureLine} />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Vadrouille avant - merged cell */}
                <View style={s.cellVadAvant}>
                  <View style={s.nameWithSignature}>
                    <Text style={s.nameText}>{week.vadrouilleAvant}</Text>
                    <View style={s.signatureRow}>
                      <Svg style={s.pencilIcon} viewBox="0 0 24 24">
                        <Path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" fill="#999" />
                      </Svg>
                      <View style={s.signatureLine} />
                    </View>
                  </View>
                </View>

                {/* Vadrouille arrière - merged cell */}
                <View style={s.cellVadArriere}>
                  <View style={s.nameWithSignature}>
                    <Text style={s.nameText}>{week.vadrouilleArriere}</Text>
                    <View style={s.signatureRow}>
                      <Svg style={s.pencilIcon} viewBox="0 0 24 24">
                        <Path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" fill="#999" />
                      </Svg>
                      <View style={s.signatureLine} />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}
