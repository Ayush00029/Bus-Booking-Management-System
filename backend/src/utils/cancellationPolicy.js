/**
 * Cancellation & Refund Policy Calculation
 * Rules:
 *  - More than 24 hours before departure: 80% refund (20% penalty fee)
 *  - Between 12 and 24 hours before departure: 50% refund (50% penalty fee)
 *  - Less than 12 hours before departure or past departure: 0% refund (100% penalty fee)
 */
const calculateRefund = (departureDateTime, totalFare, cancellationTime = new Date()) => {
  const depTime = new Date(departureDateTime).getTime();
  const cancelTime = new Date(cancellationTime).getTime();

  const diffMs = depTime - cancelTime;
  const hoursUntilDeparture = diffMs / (1000 * 60 * 60);

  let refundPercentage = 0;
  let refundStatus = 'NONE';

  if (hoursUntilDeparture > 24) {
    refundPercentage = 80;
    refundStatus = 'PROCESSED';
  } else if (hoursUntilDeparture >= 12) {
    refundPercentage = 50;
    refundStatus = 'PROCESSED';
  } else {
    refundPercentage = 0;
    refundStatus = 'NONE';
  }

  const refundAmount = Math.round((totalFare * refundPercentage) / 100);
  const cancellationFee = totalFare - refundAmount;

  return {
    hoursUntilDeparture: Number(hoursUntilDeparture.toFixed(2)),
    refundPercentage,
    cancellationFee,
    refundAmount,
    refundStatus,
    isEligible: hoursUntilDeparture > 0
  };
};

module.exports = {
  calculateRefund
};

