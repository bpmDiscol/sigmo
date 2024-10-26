import formatCurrency from "./formatCurrency";

export default function formatIfNumber(input) {
    const number = parseFloat(input);
  
    if (!isNaN(number) && isFinite(number)) {
      return formatCurrency(number);
    } else {
      return input;
    }
  }