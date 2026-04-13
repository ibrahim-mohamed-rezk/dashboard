import { User } from "@/lib/type";
import { canAccessModule } from "@/lib/permissions";

const useAuthrization = ({
  user,
  module,
}: {
  user: User;
  module: string | string[];
}) => {
  return canAccessModule(user?.modules, module);
};

export default useAuthrization;