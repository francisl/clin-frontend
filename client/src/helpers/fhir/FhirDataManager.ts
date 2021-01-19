import {
  ClinicalImpression, Patient, Reference,
} from './types';

type InitializePatientOptions = {
  id: string;
  family: string;
  given: string;
  active: boolean;
  birthDate: Date;
  gender: string;
  ramq: string;
  mrn: string;
  practitionerId: string;
  ethnicityCode: string;
  ethnicityDisplay: string;
  isProband: boolean;
  bloodRelationship: string;
  organization: string;
  generalPractitioner?: Reference[];
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  let month = `${date.getMonth() + 1}`;
  let day = `${date.getDate()}`;

  if (month.length < 2) month = `0${month}`;
  if (day.length < 2) day = `0${day}`;

  return [year, month, day].join('-');
};

export class FhirDataManager {
  public static createPatient(options: InitializePatientOptions): Patient {
    const formattedBirthDate = formatDate(options.birthDate);

    const patient: Patient = {
      resourceType: 'Patient',
      meta: {
        profile: ['http://fhir.cqgc.ferlab.bio/StructureDefinition/cqgc-patient'],
      },
      active: options.active,
      birthDate: formattedBirthDate,
      extension: [
        {
          url: 'http://fhir.cqgc.ferlab.bio/StructureDefinition/is-proband',
          valueBoolean: true,
        },
      ],
      gender: options.gender,
      generalPractitioner: options.generalPractitioner!,
      identifier: [
        {
          type: {
            coding: [
              {
                code: 'MR',
                display: 'Medical record number',
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              },
            ],
            text: 'Numéro du dossier médical',
          },
          value: options.mrn,
        },
      ],
      managingOrganization: {
        reference: `Organization/${options.organization}`,
      },
      name: [
        {
          family: options.family,
          given: [options.given],
        },
      ],
    };
    if (
      options.ethnicityCode != null
      && options.ethnicityDisplay != null
      && options.ethnicityCode.length > 0
      && options.ethnicityDisplay.length > 0
    ) {
      patient.extension.push({
        url: 'http://fhir.cqgc.ferlab.bio/StructureDefinition/qc-ethnicity',
        valueCoding: {
          system: 'http://fhir.cqgc.ferlab.bio/CodeSystem/qc-ethnicity',
          code: options.ethnicityCode,
          display: options.ethnicityDisplay,
        },
      });
    }
    if (options.bloodRelationship != null && options.bloodRelationship.length > 0) {
      const code = options.bloodRelationship.charAt(0);
      patient.extension.push({
        url: 'http://fhir.cqgc.ferlab.bio/StructureDefinition/blood-relationship',
        valueCoding: {
          system: 'http://fhir.cqgc.ferlab.bio/CodeSystem/blood-relationship',
          code,
          display: code === 'Y' ? 'Yes' : code === 'N' ? 'No' : 'Unknown',
        },
      });
    }

    if (options.ramq != null && options.ramq.length > 0) {
      patient.identifier.push({
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'JHN',
              display: 'Jurisdictional health number (Canada)',
            },
          ],
          text: 'Numéro du dossier médical',
        },
        value: options.ramq,
      });
    }

    if (options.id != null) {
      patient.id = options.id;
    }

    return patient;
  }

  private static getPractitionerReference(id: string) : Reference | undefined {
    if (id == null) {
      return undefined;
    }
    return {
      reference: `Practitioner/${id}`,
    };
  }

  private static getPractitionerRoleReference(id: string) : Reference | undefined {
    if (id == null) {
      return undefined;
    }
    return {
      reference: `PractitionerRole/${id}`,
    };
  }

  public static createClinicalImpression(assessorId: string, subjectId: string, submitted: boolean, age: number = 1): ClinicalImpression {
    const clinicalImpression: ClinicalImpression = {
      resourceType: 'ClinicalImpression',
      meta: {
        profile: ['http://fhir.cqgc.ferlab.bio/StructureDefinition/cqgc-clinical-impression'],
      },

      extension: [
        {
          url: 'http://fhir.cqgc.ferlab.bio/StructureDefinition/age-at-event',
          valueAge: {
            value: age,
            unit: 'days',
            system: 'http://unitsofmeasure.org',
            code: 'd',
          },
        },
      ],
      status: submitted ? 'completed' : 'in-progress',
      assessor: this.getPractitionerRoleReference(assessorId),
      date: formatDate(new Date()),
      subject: {
        reference: subjectId.startsWith('urn:') ? subjectId : `Patient/${subjectId}`,
      },
      investigation: [
        {
          code: {
            text: 'initial-examination',
          },
          item: [],
        },
      ],
    };
    return clinicalImpression;
  }
}
