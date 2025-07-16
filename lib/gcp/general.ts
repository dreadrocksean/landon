import { DocumentReference, getDoc } from "firebase/firestore";

// Define ResponseData type
export type ResponseData<T> = {
  success: boolean;
  data: T & { id: string };
};

export const getDataFromRef = async <T>(
  ref: DocumentReference<T>
): Promise<ResponseData<T>> => {
  try {
    const snap = await getDoc(ref);
    const data = snap.data();
    if (!data) {
      throw new Error("Document data does not exist");
    }
    return Promise.resolve({
      success: true,
      data: { ...data, id: ref.id },
    });
  } catch (err) {
    throw err;
  }
};
