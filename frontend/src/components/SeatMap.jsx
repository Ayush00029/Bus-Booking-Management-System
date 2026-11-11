import React, { useState } from 'react';
import { Armchair, Bed, Check, Lock, Info } from 'lucide-react';

export default function SeatMap({
  seatLayout = [],
  selectedSeats = [],
  onSeatToggle,
  maxSeats = 6
}) {
  const [activeDeck, setActiveDeck] = useState('lower');

  // Check if bus has upper deck seats
  const hasUpperDeck = seatLayout.some(s => s.deck === 'upper');
  const lowerDeckCount = seatLayout.filter(s => s.deck === 'lower').length;
  const upperDeckCount = seatLayout.filter(s => s.deck === 'upper').length;

  // Filter seats by active deck
  const deckSeats = seatLayout.filter(s =>
    hasUpperDeck ? s.deck === activeDeck : true
  );

  // Group deck seats by row
  const rowMap = new Map();
  deckSeats.forEach(seat => {
    if (!rowMap.has(seat.row)) {
      rowMap.set(seat.row, []);
    }
    rowMap.get(seat.row).push(seat);
  });

  const sortedRows = Array.from(rowMap.keys()).sort((a, b) => a - b);

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-surface-container">
        <div>
          <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">event_seat</span>
            Select Your Preferred Seats
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Click available berths/seats to select. Max {maxSeats} passengers per booking.
          </p>
        </div>

        {/* Deck Switcher for Sleeper buses */}
        {hasUpperDeck && (
          <div className="flex bg-surface-container-low p-1 rounded-xl border border-surface-container-high">
            <button
              type="button"
              onClick={() => setActiveDeck('lower')}
              className={`px-3.5 py-1.5 text-xs font-headline font-bold rounded-lg transition-all ${
                activeDeck === 'lower'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Lower Deck ({lowerDeckCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveDeck('upper')}
              className={`px-3.5 py-1.5 text-xs font-headline font-bold rounded-lg transition-all ${
                activeDeck === 'upper'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Upper Deck ({upperDeckCount})
            </button>
          </div>
        )}
      </div>

      {/* Seat Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 bg-surface-container-low rounded-xl text-xs font-medium text-on-surface-variant mb-6 border border-surface-container">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md border-2 border-surface-container-high bg-surface-container-lowest"></div>
          <span className="text-[11px] font-medium">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center font-bold text-[10px]">
            ✓
          </div>
          <span className="text-[11px] font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-surface-container text-outline border border-outline-variant/50 flex items-center justify-center text-[10px]">
            ✕
          </div>
          <span className="text-[11px] font-medium">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center text-[10px] font-bold">
            ⏳
          </div>
          <span className="text-[11px] font-semibold text-amber-800">Held by Others</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-pink-600">
          <span className="px-1.5 py-0.5 rounded bg-pink-50 border border-pink-200 font-bold text-[9px]">W</span>
          <span>Window Berth</span>
        </div>
      </div>

      {/* Bus Interior Layout Container */}
      <div className="max-w-lg mx-auto bg-surface-container-low border-2 border-surface-container-high rounded-3xl p-6 relative shadow-inner">
        {/* Front of bus indicator */}
        <div className="flex justify-between items-center pb-4 mb-5 border-b-2 border-dashed border-surface-container-high text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="material-symbols-outlined text-base">directions_bus</span>
            <span>FRONT OF BUS</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest rounded-lg border border-surface-container-high text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-sm text-outline">airline_seat_recline_extra</span>
            <span>Driver Cabin</span>
          </div>
        </div>

        {/* Rows of seats */}
        <div className="space-y-3.5">
          {sortedRows.map(rowNum => {
            const rowSeats = rowMap.get(rowNum) || [];
            // Sort by column: 1, 2, 3, 4
            rowSeats.sort((a, b) => a.column - b.column);

            // Separate left and right side of aisle
            const leftSeats = rowSeats.filter(s => s.column <= 2);
            const rightSeats = rowSeats.filter(s => s.column > 2);

            return (
              <div key={rowNum} className="flex justify-between items-center gap-4">
                {/* Left Side (Columns 1, 2) */}
                <div className="flex gap-2">
                  {leftSeats.map(seat => renderSeatButton(seat, selectedSeats, onSeatToggle))}
                </div>

                {/* Aisle Spacer */}
                <div className="w-8 text-center text-[10px] font-mono text-outline-variant font-bold uppercase tracking-wider">
                  R{rowNum}
                </div>

                {/* Right Side (Columns 3, 4) */}
                <div className="flex gap-2">
                  {rightSeats.map(seat => renderSeatButton(seat, selectedSeats, onSeatToggle))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back of bus indicator */}
        <div className="mt-6 pt-4 border-t-2 border-dashed border-surface-container-high text-center text-[10px] font-headline font-bold text-outline uppercase tracking-widest">
          REAR OF VEHICLE • EMERGENCY EXIT
        </div>
      </div>
    </div>
  );
}

// Helper to render individual seat button
function renderSeatButton(seat, selectedSeats, onSeatToggle) {
  const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
  const isBooked = seat.status === 'booked';
  const isLocked = seat.status === 'locked';
  const isSleeper = seat.seatType === 'sleeper';

  let buttonClass = 'relative rounded-xl font-headline text-xs transition-all duration-150 flex flex-col items-center justify-center select-none ';

  if (isSleeper) {
    // Sleeper berths are longer rectangles
    buttonClass += 'w-18 sm:w-20 h-11 ';
  } else {
    // Seater chairs are square
    buttonClass += 'w-11 h-11 ';
  }

  if (isBooked) {
    buttonClass += 'bg-surface-container text-outline cursor-not-allowed border border-outline-variant/40 opacity-60';
  } else if (isLocked) {
    buttonClass += 'bg-amber-100 text-amber-900 cursor-not-allowed border border-amber-300 opacity-80';
  } else if (isSelected) {
    buttonClass += 'bg-primary text-white shadow-md shadow-primary/25 border-2 border-primary-container scale-102';
  } else {
    buttonClass += 'bg-surface-container-lowest text-on-surface border-2 border-surface-container-high hover:border-primary hover:shadow-xs';
  }

  return (
    <button
      key={seat.seatNumber}
      type="button"
      disabled={isBooked || isLocked}
      onClick={() => onSeatToggle(seat)}
      title={`${seat.seatNumber} (${seat.seatType}) - ₹${seat.fare} ${isBooked ? '[Booked]' : isLocked ? '[Held by Another User]' : '[Available]'}`}
      className={buttonClass}
    >
      <div className="flex items-center gap-1 font-bold text-[11px] leading-tight">
        <span>{seat.seatNumber}</span>
        {seat.isWindow && !isSelected && !isBooked && !isLocked && (
          <span className="text-[8px] font-bold text-pink-600 bg-pink-50 px-1 rounded">W</span>
        )}
      </div>

      <span className={`text-[9px] font-mono leading-tight ${isSelected ? 'text-primary-fixed' : isLocked ? 'text-amber-800' : 'text-on-surface-variant'}`}>
        {isLocked ? 'Held' : `₹${seat.fare}`}
      </span>

      {isSelected && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs">
          ✓
        </span>
      )}
      {isBooked && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-outline-variant text-white rounded-full flex items-center justify-center text-[8px] font-bold">
          ✕
        </span>
      )}
      {isLocked && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
          ⏳
        </span>
      )}
    </button>
  );
}
