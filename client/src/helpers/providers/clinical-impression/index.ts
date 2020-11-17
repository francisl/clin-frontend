import { get } from "lodash";
import { ClinicalImpression, Observation } from "../../fhir/types";
import { ConsultationSummary } from "../types";
//@ts-ignore
import { DataExtractor } from "../extractor";
//@ts-ignore
import { Provider, Record } from "../providers.ts";

const CGH_CODE = "CGH";
const CGH_INVES = "INVES";
const CGH_INDIC = "INDIC";

export class ClinicalImpressionProvider extends Provider<ClinicalImpression, ConsultationSummary> {
  constructor(name: string) {
    super(name);
  }

  public doProvide(dataExtractor: DataExtractor): Record<ClinicalImpression, ConsultationSummary>[] {
    const clinicalImpressionBundle = dataExtractor.extractBundle("ClinicalImpression");

    const clinicalImpression = dataExtractor.extractResource<ClinicalImpression>(
      clinicalImpressionBundle,
      "ClinicalImpression"
    );
    const observations = dataExtractor.extractResources<Observation>(clinicalImpressionBundle, "Observation");
    const cgh = observations.find((observation) => get(observation, "code.coding[0].code", "") === CGH_CODE);
    const inves = observations.find((observation) => get(observation, "code.coding[0].code", "") === CGH_INVES);
    const indic = observations.find((observation) => get(observation, "code.coding[0].code", "") === CGH_INDIC);

    const assessor = dataExtractor.getPractitionerDataByReference(
      clinicalImpression,
      "assessor",
      clinicalImpressionBundle
    );
    const consultationSummary: ConsultationSummary = {
      cgh: get(cgh, "interpretation[0].coding[0].code", "IND"),
      hypothesis: get(indic, "note[0].text", "N/A"),
      practitioner:
        assessor != null
          ? assessor
          : {
              email: "N/A",
              hospital: "N/A",
              name: "N/A",
              phone: "N/A",
              mrn: "N/A",
              organization: "N/A"
            },
      summary: get(inves, "note[0].text", "N/A"),
    };

    return [
      {
        original: clinicalImpression,
        parsed: consultationSummary,
      },
    ];
  }
}
