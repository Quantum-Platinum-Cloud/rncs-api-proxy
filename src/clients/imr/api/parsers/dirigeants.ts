//==============
// Representants
//==============

import {
  formatFirstNames,
  formatNameFull,
} from '../../../../utils/helpers/formatters';
import { formatINPIDateField, formatINPIDateFieldPartial } from '../../helper';

import { IRNCSRepresentantResponse, IRNCSResponseDossier } from '..';
import { IDirigeant } from '../../../../models/imr';
import { logWarningInSentry } from '../../../../utils/sentry';

export const extractRepresentants = (dossier: IRNCSResponseDossier) => {
  const representantsObject = dossier?.representants?.representant;

  if (!representantsObject) {
    if (!dossier.identite || !dossier.identite.identite_PP) {
      logWarningInSentry('No Dirigeant found', { siren: dossier['@_siren'] });
      return [];
    }
    const representantEI = extractDirigeantFromIdentite(dossier);
    return [representantEI];
  }

  const representants = Array.isArray(representantsObject)
    ? representantsObject
    : [representantsObject];

  return representants.map(mapToDomainDirigeant);
};

const mapToDomainDirigeant = (
  dirigeant: IRNCSRepresentantResponse
): IDirigeant => {
  const {
    prenoms = '',
    nom_patronymique,
    nom_usage,
    lieu_naiss = '',
    code_pays_naiss = '',
    dat_naiss = '',
    qualites,
    form_jur = '',
    siren,
    denomination = '',
    type,
  } = dirigeant;

  const qualite = (qualites || {}).qualite;
  const roles = Array.isArray(qualite) ? qualite.join(', ') : qualite;

  if (type === 'P.Physique') {
    return {
      sexe: null,
      prenom: formatFirstNames(prenoms),
      nom: formatNameFull(nom_patronymique, nom_usage),
      role: roles || '',
      lieuNaissance: lieu_naiss + ', ' + code_pays_naiss,
      dateNaissancePartial: formatINPIDateFieldPartial(dat_naiss),
      dateNaissanceFull: formatINPIDateField(dat_naiss),
    };
  } else {
    const sirenAsString = (siren || '').toString();
    return {
      siren: sirenAsString,
      denomination: denomination,
      role: roles || '',
      natureJuridique: form_jur,
    };
  }
};

export const extractDirigeantFromIdentite = (
  dossierPrincipal: IRNCSResponseDossier
) => {
  return mapToDomainFromIdentite(dossierPrincipal);
};

const mapToDomainFromIdentite = (
  dossierPrincipal: IRNCSResponseDossier
): IDirigeant => {
  const {
    identite_PP: {
      nom_patronymique,
      nom_usage,
      prenom = '',
      dat_naiss = '',
      lieu_naiss = '',
      pays_naiss = '',
    },
  } = dossierPrincipal.identite;

  return {
    sexe: null,
    prenom: formatFirstNames(prenom),
    nom: formatNameFull(nom_patronymique, nom_usage),
    role: 'Représentant Légal',
    lieuNaissance: lieu_naiss + ', ' + pays_naiss,
    dateNaissancePartial: formatINPIDateFieldPartial(dat_naiss),
    dateNaissanceFull: formatINPIDateField(dat_naiss),
  };
};
