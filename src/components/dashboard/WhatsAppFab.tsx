import { WhatsAppIcon } from "@/components/shared/Icons";

interface Props {
  phoneNumber: string;
  customerName: string;
}

export function WhatsAppFab({ phoneNumber }: Props) {
  const href = `https://wa.me/${phoneNumber}`;
  return (
    <a
      className="hk-fab"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="פנייה בוואטסאפ"
    >
      <WhatsAppIcon />
    </a>
  );
}
