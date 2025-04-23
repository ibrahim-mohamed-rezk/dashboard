import { getDictionary } from "@/app/dictionaries";
import EcommercePageView from "./page-view";


const EcommercePage = async () => {
  const trans = await getDictionary("ar");
  return <EcommercePageView trans={trans} />;
};

export default EcommercePage;
