"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  useFieldArray,
  useForm,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { z } from "zod";

import type { Course, WeddingConfig } from "@/types/wedding";

import { Field, Input } from "@/components/ui/FormPrimitives";

const schema = z.object({
  menuCourses: z.array(
    z.object({
      course: z.string().min(1, "Course name is required"),
      items: z
        .array(z.object({ value: z.string().min(1, "Dish cannot be empty") }))
        .min(1, "Add at least one dish"),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

interface CourseCardProps {
  courseIndex: number;
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  onRemove: () => void;
}

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

// Convert WeddingConfig Course[] → form shape
function toFormValues(courses: Course[]): FormValues["menuCourses"] {
  return courses.map((c) => ({
    course: c.course,
    items: c.items.map((value) => ({ value })),
  }));
}

// Convert form shape → WeddingConfig Course[]
function toCourses(courses: FormValues["menuCourses"]): Course[] {
  return courses.map((c) => ({
    course: c.course,
    items: c.items.map((item) => item.value),
  }));
}

export function MenuEditor({ config, onChange }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { menuCourses: toFormValues(config.menuCourses ?? []) },
    mode: "onChange",
  });

  const {
    fields: courseFields,
    append: appendCourse,
    remove: removeCourse,
  } = useFieldArray({ control, name: "menuCourses" });

  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      if (values.menuCourses) {
        onChange({
          menuCourses: toCourses(
            values.menuCourses as FormValues["menuCourses"],
          ),
        });
      }
    });
    return unsubscribe;
  }, [watch, onChange]);

  return (
    <div className="space-y-5">
      <p
        className="font-label text-[10px] tracking-[0.5em] uppercase"
        style={{ color: "#D4AF3770" }}
      >
        Wedding Menu
      </p>

      {courseFields.map((courseField, courseIndex) => (
        <CourseCard
          key={courseField.id}
          courseIndex={courseIndex}
          register={register}
          control={control}
          errors={errors}
          onRemove={() => removeCourse(courseIndex)}
        />
      ))}

      <button
        type="button"
        onClick={() => appendCourse({ course: "", items: [{ value: "" }] })}
        className="w-full py-3 rounded-xl font-label text-[10px] tracking-[0.4em]
                  uppercase transition-all border"
        style={{
          borderColor: "#D4AF3730",
          color: "#D4AF3770",
          borderStyle: "dashed",
        }}
      >
        + Add Course
      </button>
    </div>
  );
}

function CourseCard({
  courseIndex,
  register,
  control,
  errors,
  onRemove,
}: CourseCardProps) {
  // This now works correctly — "menuCourses" is the only top-level
  // field array name, and we nest into it via courseIndex
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `menuCourses.${courseIndex}.items` as `menuCourses.${number}.items`,
  });

  const courseError = errors.menuCourses?.[courseIndex]?.course?.message;
  // items is an array field — the root message lives on the array itself
  const itemsArrayError = (
    errors.menuCourses?.[courseIndex]?.items as { message?: string } | undefined
  )?.message;

  return (
    <div
      className="p-4 rounded-xl space-y-4 relative"
      style={{ background: "#D4AF3708", border: "1px solid #D4AF3720" }}
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3 right-3 font-label text-[10px] tracking-widest"
        style={{ color: "#D4AF3750" }}
      >
        ✕
      </button>

      <Field label="Course Name" error={courseError}>
        <Input
          {...register(`menuCourses.${courseIndex}.course`)}
          placeholder="Amuse-Bouche"
          hasError={!!courseError}
        />
      </Field>

      <div className="space-y-2">
        <p
          className="font-label text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#D4AF3760" }}
        >
          Dishes
        </p>

        {itemsArrayError && (
          <p
            className="font-display italic text-xs"
            style={{ color: "#ff6b6b" }}
          >
            {itemsArrayError}
          </p>
        )}

        {itemFields.map((itemField, itemIndex) => {
          const itemError =
            errors.menuCourses?.[courseIndex]?.items?.[itemIndex]?.value
              ?.message;

          return (
            <div key={itemField.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  {...register(
                    `menuCourses.${courseIndex}.items.${itemIndex}.value`,
                  )}
                  placeholder="Truffle Arancini"
                  hasError={!!itemError}
                />
                {itemError && (
                  <p
                    className="font-display italic text-xs mt-1"
                    style={{ color: "#ff6b6b" }}
                  >
                    {itemError}
                  </p>
                )}
              </div>
              {itemFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(itemIndex)}
                  className="font-label text-[10px] mt-2.5 shrink-0"
                  style={{ color: "#D4AF3750" }}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => appendItem({ value: "" })}
          className="font-label text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#D4AF3760" }}
        >
          + Add Dish
        </button>
      </div>
    </div>
  );
}
