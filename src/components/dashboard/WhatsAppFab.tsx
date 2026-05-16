import { WhatsAppIcon } from "@/components/shared/Icons";

interface Props {
  phoneNumber: string;
  customerName: string;
}

export function WhatsAppFab({ phoneNumber, customerName }: Props) {
  const message = encodeURIComponent(
    `שלום, אני ${customerName} ויש לי שאלה לגבי האזור האישי שלי`,
  );
  const href = `https://wa.me/${phoneNumber}?text=${message}`;
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
