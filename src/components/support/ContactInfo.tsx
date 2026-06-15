import { Phone, Mail, MessageCircle, Clock, MapPin } from "lucide-react";
import { useSupportContact } from "@/hooks/useSupportContact";

const ContactInfo = () => {
  const { data: contact } = useSupportContact();
  if (!contact) return null;

  const waNumber = contact.whatsapp.replace(/\D/g, "");

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-foreground">Fale Conosco</h3>
        <p className="text-sm text-muted-foreground mt-1">{contact.response_sla}</p>
      </div>

      <ul className="space-y-3">
        <li>
          <a href={`tel:${contact.phone.replace(/\D/g, "")}`} className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
            <Phone className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            <span>{contact.phone}</span>
          </a>
        </li>
        <li>
          <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-foreground hover:text-primary transition-colors break-all">
            <Mail className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            <span>{contact.email}</span>
          </a>
        </li>
        <li>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        </li>
        <li className="flex items-center gap-3 text-muted-foreground">
          <Clock className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <span>{contact.hours}</span>
        </li>
        <li className="flex items-start gap-3 text-muted-foreground">
          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <span>{contact.address}</span>
        </li>
      </ul>
    </div>
  );
};

export default ContactInfo;
