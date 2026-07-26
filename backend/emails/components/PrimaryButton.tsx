import {
  Button,
} from "@react-email/components";

interface Props {
  href: string;
  text: string;
  color: string;
}

export default function PrimaryButton({
  href,
  text,
  color,
}: Props) {
  return (
    <Button
      href={href}
      style={{
        background: color,
        color: "#fff",
        padding: "14px 28px",
        borderRadius: "8px",
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {text}
    </Button>
  );
}