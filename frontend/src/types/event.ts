export type EventType = 'event' | 'workshop' | 'project';

export type EventStatus = 'concept' | 'voorbereid' | 'afgerond' | 'compleet';

export type SprekerRol = 'spreker' | 'moderator' | 'panellid';

export type RegistratieBron = 'tally' | 'tickettailor' | 'ticket_tailor' | 'manueel' | 'afc_ticket';

export interface AcademicYear {
  id: string;
  naam: string;
  start_datum: string;
  eind_datum: string;
  is_huidig: boolean;
  created_at: string;
}

export interface Domain {
  id: string;
  naam: string;
  created_at: string;
}

export interface Spreker {
  id: string;
  event_id: string;
  rol: SprekerRol;
  naam: string;
  email?: string;
  telefoon?: string;
  omschrijving?: string;
  volgorde: number;
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  bron: RegistratieBron;
  email: string;
  faculteit?: string;
  hoe_gevonden?: string;
  studiejaar?: string;
  ingediend_op?: string;
  voornaam?: string;
  achternaam?: string;
  naam?: string;
  ingeschreven_op?: string;
  checked_in: boolean;
  registered_at: string;
  /** Ticketing fields (bron = afc_ticket) */
  phone?: string | null;
  extra_info?: string | null;
  food_preference?: string | null;
  cv_original_name?: string | null;
  cv_path?: string | null;
  ticket_token?: string | null;
  ticket_code?: string | null;
  checked_in_at?: string | null;
  cancelled_at?: string | null;
}

/** Registration row from AFC public ticketing */
export type TicketRegistration = Registration & {
  bron: 'afc_ticket';
  naam: string;
  phone: string;
  food_preference: string;
  ticket_token: string;
};

export interface Feedback {
  id: string;
  event_id: string;
  email?: string;
  schaal_1?: number;
  schaal_2?: number;
  schaal_3?: number;
  wat_kon_beter?: string;
  favo_onderdeel?: string;
  andere_opmerkingen?: string;
  created_at: string;
}

export interface Event {
  id: string;
  academic_year_id: string;
  type: EventType;
  status: EventStatus;
  is_published: boolean;
  titel: string;
  beschrijving_website?: string;
  beschrijving_sociaal?: string;
  event_datum?: string;
  locatie?: string;
  max_deelnemers?: number;
  deuren_open?: string;
  start_tijd?: string;
  einde_tijd?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  /** Public ticketing (synced with /inschrijven) */
  ticket_enabled?: boolean;
  ticket_slug?: string | null;
  ticket_intro?: string | null;
  ticket_is_open?: boolean;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  ticket_image_path?: string | null;
  // Relations
  sprekers?: Spreker[];
  registraties?: Registration[];
  feedback?: Feedback[];
  domains?: Domain[];
}

export interface EventRolUser {
  event_rol_id: string;
  user_id: string;
  created_at: string;
  // joined client-side via get_users_info rpc
  user_email?: string;
  user_naam?: string | null;
}

export interface EventRol {
  id: string;
  event_id: string;
  naam: string;
  beschrijving: string | null;
  start_uur: string | null;
  eind_uur: string | null;
  plaatsen: number;
  is_default: boolean;
  created_at: string;
  toegewezen?: EventRolUser[];
}
export interface EventRolFormData {
  naam: string;
  beschrijving: string;
  start_uur: string | null;
  eind_uur: string | null;
  plaatsen: number;
}

export interface EventFormData {
  type: EventType;
  titel: string;
  beschrijving_website?: string;
  beschrijving_sociaal?: string;
  event_datum?: string;
  locatie?: string;
  max_deelnemers?: number;
  deuren_open?: string;
  start_tijd?: string;
  einde_tijd?: string;
  sprekers?: Omit<Spreker, 'id' | 'event_id' | 'created_at'>[];
  domain_ids?: string[];
  ticket_enabled?: boolean;
  ticket_slug?: string | null;
  ticket_intro?: string | null;
  ticket_is_open?: boolean;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
}

export interface TallyRegistration {
  submission_id: string;
  respondent_id: string;
  submitted_at: string;
  form_id: string;
  first_name: string;
  last_name: string;
  email: string;
  link_linkedin?: string;
  gender?: string;
  study_program?: string;
  faculty?: string;
  level_of_education?: string;
  is_in_final_year?: string;
  activity_encounter?: string;
  gdpr_confirmed?: string;
  studying_ghent?: string;
  can_send_resume?: string;
  is_proficient_in_dutch?: string;
}

export interface TicketTailorRegistration {
  name: string;
  ticket_type: string;
  ticket_code: string;
  order_id: string;
  status?: string;
  checked_in: string;
  group_ticket_code?: string;
  faculteit?: string;
  hoe_gevonden?: string;
  study_program?: string;
  studiejaar?: string;
  buyer_name?: string;
  email_address: string;
  ingediend_op?: string;
  ingeschreven_op?: string;
}

export interface FeedbackImport {
  submission_id: string;
  respondent_id: string;
  submitted_at: string;
  form_id: string;
  email?: string;
  vraag_1?: number;
  vraag_2?: number;
  vraag_3?: number;
  wat_kon_beter?: string;
  favo_onderdeel?: string;
  andere_opmerkingen?: string;
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  concept: 'Concept',
  voorbereid: 'Voorbereid',
  afgerond: 'Afgerond',
  compleet: 'Compleet',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  event: 'Event',
  workshop: 'Workshop',
  project: 'Project',
};

export const STATUS_ORDER: EventStatus[] = ['concept', 'voorbereid', 'afgerond', 'compleet'];

export const getNextStatus = (current: EventStatus): EventStatus | null => {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx < STATUS_ORDER.length - 1) return STATUS_ORDER[idx + 1];
  return null;
};

export const isEditable = (status: EventStatus): boolean => {
  return status === 'concept' || status === 'afgerond';
};