import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { docStyles } from "../pdf/documentStyles";
import type { Party } from "../types";

type PartyDetailsProps = {
  billedBy: Party;
  billedTo: Party;
  toLabel: string;
};

export function PartyDetails({ billedTo, toLabel }: PartyDetailsProps) {
  return (
    <View style={docStyles.billedToSection}>
      <Text style={docStyles.partyLabel}>{toLabel}</Text>
      <Text style={docStyles.partyName}>{billedTo.name}</Text>
      {billedTo.address ? (
        <Text style={docStyles.partyDetail}>{billedTo.address}</Text>
      ) : null}
      {billedTo.phone ? (
        <Text style={docStyles.partyDetail}>Phone: {billedTo.phone}</Text>
      ) : null}
      {billedTo.email ? (
        <Text style={docStyles.partyDetail}>Email: {billedTo.email}</Text>
      ) : null}
      {billedTo.gstin ? (
        <Text style={docStyles.partyDetail}>GSTIN: {billedTo.gstin}</Text>
      ) : null}
    </View>
  );
}
