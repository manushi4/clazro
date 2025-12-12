import React from "react";
import { Text, TextProps } from "react-native";
import { useAppTheme } from "../../theme/useAppTheme";
import { buildTokens } from "../tokens";

type Variant = "heading" | "title" | "body" | "caption";

type Props = TextProps & { variant?: Variant };

export const AppText: React.FC<Props> = ({ variant = "body", style, children, ...rest }) => {
  const { colors, ...paperTheme } = useAppTheme();
  const tokens = buildTokens({ colors } as any);
  const sizes = {
    heading: tokens.typography.heading,
    title: tokens.typography.title,
    body: tokens.typography.body,
    caption: tokens.typography.caption,
  };
  const weight = variant === "heading" ? "700" : variant === "title" ? "600" : "400";

  return (
    <Text
      {...rest}
      allowFontScaling
      style={[
        { color: colors.onBackground, fontSize: sizes[variant], fontWeight: weight },
        style,
      ]}
    >
      {children}
    </Text>
  );
};
