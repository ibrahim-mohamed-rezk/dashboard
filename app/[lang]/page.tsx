import LoginPage from "./auth/(login)/login/page";

const page = ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  return <LoginPage searchParams={searchParams} />;
};

export default page;
