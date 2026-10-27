"use strict";

const themeButton = document.getElementById("theme");
const registrationForm = document.getElementById("regform");
const memberList = document.getElementById("memberList");
const memberCount = document.getElementById("count");
const successMessage = document.getElementById("successMsg");
const emptyNote = document.getElementById("emptyNote");

const registeredEmails = new Set();
const requiredFields = [
  { id: "name", errorId: "nameError", label: "Full name" },
  { id: "email", errorId: "emailError", label: "Email" },
  { id: "password", errorId: "passwordError", label: "Password" },
  { id: "confirm-password", errorId: "confirmError", label: "Password confirmation" },
  { id: "gender", errorId: "genderError", label: "Gender" },
  { id: "dob", errorId: "dobError", label: "Date of birth" },
  { id: "country", errorId: "countryError", label: "Country" },
  { id: "phone", errorId: "phoneError", label: "Phone number" }
];

function setTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  if (themeButton) {
    themeButton.textContent = isDark ? "Light Mode" : "Dark Mode";
    themeButton.setAttribute("aria-pressed", String(isDark));
  }
}

if (themeButton) {
  let savedTheme = null;
  try {
    savedTheme = window.localStorage.getItem("webdev-theme");
  } catch (error) {
    console.warn("Theme preference could not be loaded.", error);
  }

  setTheme(savedTheme === "dark");

  themeButton.addEventListener("click", function () {
    const isDark = !document.body.classList.contains("dark");
    setTheme(isDark);
    try {
      window.localStorage.setItem("webdev-theme", isDark ? "dark" : "light");
    } catch (error) {
      console.warn("Theme preference could not be saved.", error);
    }
  });
}

function getField(id) {
  return document.getElementById(id);
}

function showFieldError(field, errorId, message) {
  const errorElement = getField(errorId);
  if (field) {
    field.classList.toggle("invalid", Boolean(message));
    if (message) {
      field.setAttribute("aria-invalid", "true");
      if (errorId) field.setAttribute("aria-describedby", errorId);
    } else {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    }
  }
  if (errorElement) errorElement.textContent = message;
}

function validateForm() {
  const values = {};
  let firstInvalidField = null;
  let valid = true;

  requiredFields.forEach(function (config) {
    const field = getField(config.id);
    if (!field) {
      console.error("Registration form is missing required field #" + config.id + ".");
      valid = false;
      return;
    }

    const rawValue = field.value;
    const value = config.id === "password" || config.id === "confirm-password"
      ? rawValue
      : rawValue.trim();
    values[config.id] = value;
    let error = "";

    if (!rawValue.trim()) {
      error = config.label + " is required.";
    } else if (config.id === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = "Enter a valid email address.";
    } else if (config.id === "password" && value.length < 8) {
      error = "Use at least 8 characters for your password.";
    } else if (config.id === "confirm-password" && value !== getField("password")?.value) {
      error = "Passwords do not match.";
    } else if (config.id === "dob" && new Date(value + "T00:00:00") >= new Date(new Date().toDateString())) {
      error = "Date of birth must be in the past.";
    } else if (config.id === "phone" && (value.replace(/\D/g, "").length < 7 || value.replace(/\D/g, "").length > 15)) {
      error = "Enter a phone number with 7 to 15 digits.";
    }

    showFieldError(field, config.errorId, error);
    if (error) {
      valid = false;
      if (!firstInvalidField) firstInvalidField = field;
    }
  });

  if (firstInvalidField) firstInvalidField.focus();
  return { values: values, valid: valid };
}

function updateEmptyState() {
  if (emptyNote && memberList) {
    emptyNote.classList.toggle("hidden", registeredEmails.size > 0);
  }
  if (memberCount) memberCount.textContent = String(registeredEmails.size);
}

function addMember(values) {
  if (!memberList) return;

  const item = document.createElement("li");
  item.className = "member-item";

  const info = document.createElement("div");
  info.className = "info";

  const name = document.createElement("strong");
  name.textContent = values.name;

  const email = document.createElement("span");
  email.textContent = values.email;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove";
  removeButton.dataset.email = values.email;
  removeButton.textContent = "Remove";
  removeButton.setAttribute("aria-label", "Remove " + values.name);

  info.append(name, email);
  item.append(info, removeButton);
  memberList.appendChild(item);
  registeredEmails.add(values.email.toLowerCase());
  updateEmptyState();
}

if (registrationForm) {
  registrationForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (successMessage) {
      successMessage.textContent = "";
      successMessage.classList.add("hidden");
    }

    const result = validateForm();
    if (!result.valid) return;

    const email = result.values.email.toLowerCase();
    if (registeredEmails.has(email)) {
      const emailField = getField("email");
      showFieldError(emailField, "emailError", "This email is already registered.");
      if (emailField) emailField.focus();
      return;
    }

    addMember({
      name: result.values.name,
      email: result.values.email
    });
    registrationForm.reset();
    requiredFields.forEach(function (config) {
      showFieldError(getField(config.id), config.errorId, "");
    });

    if (successMessage) {
      successMessage.textContent = "Registration successful. The member has been added to this page.";
      successMessage.classList.remove("hidden");
    }
  });

  registrationForm.addEventListener("input", function (event) {
    const field = event.target;
    const config = requiredFields.find(function (item) {
      return item.id === field.id;
    });
    if (config) showFieldError(field, config.errorId, "");
    if (successMessage) successMessage.classList.add("hidden");
  });
}

if (memberList) {
  memberList.addEventListener("click", function (event) {
    const removeButton = event.target.closest("button[data-email]");
    if (!removeButton) return;

    registeredEmails.delete(removeButton.dataset.email.toLowerCase());
    removeButton.closest(".member-item").remove();
    updateEmptyState();
  });
}
