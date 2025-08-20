import {
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  ModalBody,
  ModalFooter,
  useColorMode,
  useModalContext,
} from "@chakra-ui/react";
import {
  CheckIcon,
  InformationCircleIcon,
  MapPinIcon,
  PencilIcon,
} from "@heroicons/react/20/solid";
import { blueDark, gray } from "@radix-ui/colors";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateUserDetails } from "../../services/userDetailsService";

export const EditUserDetails = () => {
  const { onClose } = useModalContext();
  const { currentUserDetails, refreshUserDetails } = useAuth();
  if (!currentUserDetails) return;

  const { colorMode } = useColorMode();

  const [details, setDetails] = useState({
    name: currentUserDetails?.name,
    about: currentUserDetails?.about,
    location: currentUserDetails?.location,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleDetailsChange = async (e: any) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await updateUserDetails(currentUserDetails.$id, details);
      refreshUserDetails();
      onClose();
    } catch (error) {
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <ModalBody>
        <motion.form
          onSubmit={handleSubmit}
          className="flex flex-col text-dark-blue1 dark:text-gray-100"
        >
          <div className="flex flex-col gap-2 ">
            <div className="flex flex-col gap-1 py-2 ">
              <label
                htmlFor="username"
                className="text-sm tracking-wider text-dark-gray7  transition-[height] dark:text-gray8 dark:peer-focus:text-gray5 "
              >
                Username
              </label>
              <InputGroup>
                <InputLeftElement>
                  <PencilIcon className="h-5 w-5 dark:text-dark-gray8/50" />
                </InputLeftElement>
                <Input
                  autoFocus
                  isRequired
                  value={details.name}
                  onChange={handleDetailsChange}
                  type="text"
                  name="name"
                  id="username"
                />
              </InputGroup>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="about"
                className="text-sm tracking-wider text-dark-gray7  transition-[height] dark:text-gray8 dark:peer-focus:text-gray5 "
              >
                About
              </label>
              <InputGroup>
                <InputLeftElement>
                  <InformationCircleIcon
                    className="h-5 w-5 dark:text-dark-gray8/50"
                    pointerEvents="none"
                  />
                </InputLeftElement>
                <Input
                  isRequired
                  value={details.about}
                  onChange={handleDetailsChange}
                  type="text"
                  name="about"
                  id="about"
                />
              </InputGroup>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="location"
                className="text-sm tracking-wider text-dark-gray7  transition-[height] dark:text-gray8 dark:peer-focus:text-gray5 "
              >
                Location
              </label>
              <InputGroup>
                <InputLeftElement>
                  <MapPinIcon
                    className="h-5 w-5 dark:text-dark-gray8/50"
                    pointerEvents="none"
                  />
                </InputLeftElement>
                <Input
                  isRequired
                  value={details.location}
                  onChange={handleDetailsChange}
                  type="text"
                  name="location"
                  id="location"
                />
              </InputGroup>
            </div>
          </div>
        </motion.form>
      </ModalBody>

      <ModalFooter>
        <Button
          as={motion.button}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          bg={blueDark.blue5}
          color={colorMode === "dark" ? gray.gray2 : gray.gray3}
          isLoading={submitting}
          loadingText="Submitting"
          px={12}
          leftIcon={<CheckIcon className="h-5 w-5 " />}
          onClick={() => handleSubmit()}
        >
          Save
        </Button>
      </ModalFooter>
    </>
  );
};
