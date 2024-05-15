import { LoaderFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { ACCESS_TOKEN_KEY } from "constants/cookie.constants";
import { parse } from "cookie";
import { getUserProfile } from "server/user";

const isLoginRequired = (pathname: string) => {
  const protectRoutes = ["/write", "/setting", "login-success"];
  return protectRoutes.some((route) => pathname.startsWith(route));
};

export const links = () => [
  { rel: "stylesheet", href: "/styles/tailwind.css" },
];

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (isLoginRequired(pathname)) {
    const cookieHeader = request.headers.get("Cookie");
    const cookies = parse(cookieHeader || "");

    const accessToken = cookies[ACCESS_TOKEN_KEY];

    const { data: userData, error } = await getUserProfile(accessToken);

    // if(!userData || error){

    // }

    return { isLoginPage: true, userData };
  }

  return { isLoginPage: false };
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export default function App() {
  return <Outlet />;
}
