import { getDictionary } from "@/app/dictionaries";
import ProjectPageView from "./page-view";


const ProjectPage = async () => {
  const trans = await getDictionary("ar");
  return <ProjectPageView trans={trans} />;
};

export default ProjectPage;
