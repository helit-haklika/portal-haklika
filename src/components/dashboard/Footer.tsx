import { PlusIcon, EditIcon, ArrowOutIcon } from "@/components/shared/Icons";

interface PurchaseLink {
  label: string;
  url: string;
  sub?: string;
}

interface FooterProps {
  purchaseLinks: PurchaseLink[];
  updateDetailsUrl?: string;
}

export function Footer({ purchaseLinks, updateDetailsUrl }: FooterProps) {
  return (
    <footer className="hk-footer">
      <div className="hk-footer__heading">רכישת כרטיסיות</div>
      <div className="hk-footer__links">
        {purchaseLinks.map((link) => (
          <a
            key={link.url}
            className="hk-flink"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="hk-flink__left">
              <div className="hk-flink__icon">
                <PlusIcon />
              </div>
              <div>
                <div className="hk-flink__title">{link.label}</div>
                {link.sub && <div className="hk-flink__sub">{link.sub}</div>}
              </div>
            </div>
            <ArrowOutIcon />
          </a>
        ))}
      </div>
      {updateDetailsUrl && (
        <>
          <div className="hk-footer__heading">פרטים אישיים</div>
          <div className="hk-footer__links">
            <a
              className="hk-flink"
              href={updateDetailsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="hk-flink__left">
                <div className="hk-flink__icon">
                  <EditIcon />
                </div>
                <div>
                  <div className="hk-flink__title">עדכון פרטים</div>
                  <div className="hk-flink__sub">טלפון, פרטי תשלום, כתובת</div>
                </div>
              </div>
              <ArrowOutIcon />
            </a>
          </div>
        </>
      )}
    </footer>
  );
}
