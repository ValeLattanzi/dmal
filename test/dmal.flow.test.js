const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const CAREER_ID = 1;
const SUBJECTS = [0, 1, 2];
const PROFESSOR_ID = 101;
const IPFS_HASH = "bafybeigdyrzt5exampledmalcomposition";
const TITLE = "Fuga en Do Menor";

async function deployFixture() {
  const [admin, professor, student, recoveryWallet, externalComposer, treasury, unauthorized] =
    await ethers.getSigners();

  const registrationFee = ethers.parseEther("0.001");

  const Academy = await ethers.getContractFactory("ConservatoryAcademy");
  const academy = await Academy.connect(admin).deploy(admin.address);

  const Registry = await ethers.getContractFactory("CompositionRegistry");
  const registry = await Registry.connect(admin).deploy(
    await academy.getAddress(),
    registrationFee,
    admin.address
  );

  const Diploma = await ethers.getContractFactory("ConservatoryDiploma");
  const diploma = await Diploma.connect(admin).deploy(await academy.getAddress(), admin.address);

  const professorRole = await academy.PROFESSOR_ROLE();
  const academyRecovererRole = await academy.RECOVERER_ROLE();

  await academy.connect(admin).grantRole(professorRole, professor.address);
  await academy.connect(admin).grantRole(academyRecovererRole, await diploma.getAddress());

  return {
    academy,
    registry,
    diploma,
    registrationFee,
    admin,
    professor,
    student,
    recoveryWallet,
    externalComposer,
    treasury,
    unauthorized
  };
}

async function setupEnrolledStudent() {
  const ctx = await deployFixture();
  const { academy, admin, student } = ctx;

  await academy.connect(admin).defineCurriculum(CAREER_ID, SUBJECTS);
  await academy.connect(admin).enrollStudent(student.address, CAREER_ID);

  return ctx;
}

async function setupGraduate() {
  const ctx = await setupEnrolledStudent();
  const { academy, professor, student } = ctx;

  await academy.connect(professor).submitGrade(student.address, 0, 80, PROFESSOR_ID);
  await academy.connect(professor).submitGrade(student.address, 1, 75, PROFESSOR_ID);
  await academy.connect(professor).submitGrade(student.address, 2, 90, PROFESSOR_ID);

  return ctx;
}

async function setupDiplomaIssued() {
  const ctx = await setupGraduate();
  const { diploma, admin, student } = ctx;
  const legajoHash = ethers.keccak256(ethers.toUtf8Bytes("legajo:student:complete"));

  await diploma.connect(admin).mintDiploma(student.address, legajoHash);

  return { ...ctx, legajoHash, tokenId: 1n };
}

function commitHashFor(author, salt) {
  return ethers.solidityPackedKeccak256(
    ["string", "address", "bytes32"],
    [IPFS_HASH, author.address, salt]
  );
}

describe("DMAL green tests", function () {
  it("lets the admin define a curriculum and enroll a student", async function () {
    const { academy, admin, student } = await deployFixture();

    await expect(academy.connect(admin).defineCurriculum(CAREER_ID, SUBJECTS))
      .to.emit(academy, "CurriculumDefined")
      .withArgs(CAREER_ID, SUBJECTS);

    await expect(academy.connect(admin).enrollStudent(student.address, CAREER_ID))
      .to.emit(academy, "CareerAssigned")
      .withArgs(student.address, CAREER_ID);

    expect(await academy.activeStudents(student.address)).to.equal(true);
    expect(await academy.studentCareer(student.address)).to.equal(CAREER_ID);
  });

  it("lets the professor submit grades and marks the curriculum as complete", async function () {
    const { academy, professor, student } = await setupEnrolledStudent();

    await expect(academy.connect(professor).submitGrade(student.address, 0, 80, PROFESSOR_ID))
      .to.emit(academy, "GradeSubmitted")
      .withArgs(student.address, 0, 80, PROFESSOR_ID);
    await academy.connect(professor).submitGrade(student.address, 1, 75, PROFESSOR_ID);
    await academy.connect(professor).submitGrade(student.address, 2, 90, PROFESSOR_ID);

    expect(await academy.hasCompletedAllSubjects(student.address)).to.equal(true);
  });

  it("mints a soulbound diploma only after academic completion", async function () {
    const { diploma, admin, student, legajoHash, tokenId } = await setupDiplomaIssued();

    expect(await diploma.ownerOf(tokenId)).to.equal(student.address);
    expect(await diploma.studentDiploma(student.address)).to.equal(tokenId);
    expect(await diploma.academicLegajos(tokenId)).to.equal(legajoHash);

    await expect(diploma.connect(admin).mintDiploma(student.address, legajoHash))
      .to.be.revertedWithCustomError(diploma, "DiplomaAlreadyIssued")
      .withArgs(student.address);
  });

  it("registers student and external compositions through commit-reveal", async function () {
    const { academy, registry, admin, student, externalComposer, registrationFee } =
      await setupGraduate();
    const studentSalt = ethers.encodeBytes32String("student-salt");
    const studentCommit = commitHashFor(student, studentSalt);

    await expect(registry.connect(student).commitComposition(studentCommit))
      .to.emit(registry, "CompositionCommitted")
      .withArgs(student.address, studentCommit);

    await expect(registry.connect(student).registerComposition(IPFS_HASH, TITLE, studentSalt))
      .to.emit(registry, "CompositionRegistered")
      .withArgs(student.address, 1, IPFS_HASH);

    const storedStudentComposition = await registry.registry(1);
    expect(storedStudentComposition.author).to.equal(student.address);
    expect(storedStudentComposition.ipfsHash).to.equal(IPFS_HASH);
    expect(storedStudentComposition.title).to.equal(TITLE);

    await academy.connect(admin).setStudentActivity(student.address, false);

    const externalSalt = ethers.encodeBytes32String("external-salt");
    const externalCommit = commitHashFor(externalComposer, externalSalt);
    await registry.connect(externalComposer).commitComposition(externalCommit);

    await expect(
      registry
        .connect(externalComposer)
        .registerComposition(IPFS_HASH, TITLE, externalSalt, { value: registrationFee })
    )
      .to.emit(registry, "CompositionRegistered")
      .withArgs(externalComposer.address, 2, IPFS_HASH);
  });

  it("reissues a diploma and migrates the active academy wallet", async function () {
    const { academy, diploma, admin, student, recoveryWallet, tokenId, legajoHash } =
      await setupDiplomaIssued();

    await expect(diploma.connect(admin).burnAndReissue(student.address, recoveryWallet.address, tokenId))
      .to.emit(diploma, "DiplomaReissued")
      .withArgs(student.address, recoveryWallet.address, 2);

    await expect(diploma.ownerOf(tokenId)).to.be.reverted;
    expect(await diploma.ownerOf(2)).to.equal(recoveryWallet.address);
    expect(await diploma.academicLegajos(2)).to.equal(legajoHash);
    expect(await diploma.studentDiploma(student.address)).to.equal(0);
    expect(await diploma.studentDiploma(recoveryWallet.address)).to.equal(2);
    expect(await academy.activeStudents(student.address)).to.equal(false);
    expect(await academy.activeStudents(recoveryWallet.address)).to.equal(true);
    expect(await academy.activeWalletOfCanonical(student.address)).to.equal(recoveryWallet.address);
  });

  it("withdraws external registration fees to treasury", async function () {
    const { registry, externalComposer, treasury, registrationFee } = await deployFixture();
    const salt = ethers.encodeBytes32String("external-paid");
    const commit = commitHashFor(externalComposer, salt);

    await registry.connect(externalComposer).commitComposition(commit);
    await registry
      .connect(externalComposer)
      .registerComposition(IPFS_HASH, TITLE, salt, { value: registrationFee });

    expect(await ethers.provider.getBalance(await registry.getAddress())).to.equal(registrationFee);

    await expect(() => registry.withdrawFunds(treasury.address)).to.changeEtherBalances(
      [registry, treasury],
      [-registrationFee, registrationFee]
    );

    expect(await ethers.provider.getBalance(await registry.getAddress())).to.equal(0);
  });
});

describe("DMAL red tests", function () {
  it("rejects actions from accounts without the required roles", async function () {
    const { academy, diploma, registry, unauthorized, student, treasury } =
      await deployFixture();
    const registrarRole = await academy.REGISTRAR_ROLE();
    const professorRole = await academy.PROFESSOR_ROLE();
    const issuerRole = await diploma.ISSUER_ROLE();
    const adminRole = await registry.DEFAULT_ADMIN_ROLE();

    await expect(academy.connect(unauthorized).defineCurriculum(CAREER_ID, SUBJECTS))
      .to.be.revertedWithCustomError(academy, "AccessControlUnauthorizedAccount")
      .withArgs(unauthorized.address, registrarRole);

    await expect(academy.connect(unauthorized).submitGrade(student.address, 0, 80, PROFESSOR_ID))
      .to.be.revertedWithCustomError(academy, "AccessControlUnauthorizedAccount")
      .withArgs(unauthorized.address, professorRole);

    await expect(diploma.connect(unauthorized).mintDiploma(student.address, ethers.ZeroHash))
      .to.be.revertedWithCustomError(diploma, "AccessControlUnauthorizedAccount")
      .withArgs(unauthorized.address, issuerRole);

    await expect(registry.connect(unauthorized).withdrawFunds(treasury.address))
      .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
      .withArgs(unauthorized.address, adminRole);
  });

  it("rejects invalid academy flows", async function () {
    const { academy, admin, professor, student, unauthorized } = await deployFixture();

    await expect(academy.connect(professor).submitGrade(student.address, 0, 80, PROFESSOR_ID))
      .to.be.revertedWith("El alumno no esta activo en la institucion");

    await academy.connect(admin).defineCurriculum(CAREER_ID, SUBJECTS);
    await academy.connect(admin).enrollStudent(student.address, CAREER_ID);

    await expect(academy.connect(professor).submitGrade(student.address, 0, 101, PROFESSOR_ID))
      .to.be.revertedWith("La nota debe estar entre 0 y 100");

    await academy.connect(professor).submitGrade(student.address, 0, 80, PROFESSOR_ID);

    await expect(academy.connect(professor).submitGrade(student.address, 0, 90, PROFESSOR_ID))
      .to.be.revertedWith("La materia ya fue aprobada previamente");

    expect(await academy.hasCompletedAllSubjects(student.address)).to.equal(false);
    expect(await academy.hasCompletedAllSubjects(unauthorized.address)).to.equal(false);
  });

  it("rejects invalid diploma flows and token transfers", async function () {
    const { academy, diploma, admin, professor, student, recoveryWallet, unauthorized } =
      await setupEnrolledStudent();

    await expect(diploma.connect(admin).mintDiploma(student.address, ethers.ZeroHash))
      .to.be.revertedWithCustomError(diploma, "CurriculumIncomplete")
      .withArgs(student.address);

    await academy.connect(professor).submitGrade(student.address, 0, 80, PROFESSOR_ID);
    await academy.connect(professor).submitGrade(student.address, 1, 75, PROFESSOR_ID);
    await academy.connect(professor).submitGrade(student.address, 2, 90, PROFESSOR_ID);
    await diploma.connect(admin).mintDiploma(student.address, ethers.ZeroHash);

    await expect(diploma.connect(student).transferFrom(student.address, unauthorized.address, 1))
      .to.be.revertedWithCustomError(diploma, "SBTTransferLocked");

    await expect(
      diploma.connect(student)["safeTransferFrom(address,address,uint256)"](
        student.address,
        unauthorized.address,
        1
      )
    ).to.be.revertedWithCustomError(diploma, "SBTTransferLocked");

    await expect(diploma.connect(admin).burnAndReissue(unauthorized.address, recoveryWallet.address, 1))
      .to.be.revertedWithCustomError(diploma, "TokenNotOwnedByWallet")
      .withArgs(1, unauthorized.address);
  });

  it("rejects reissue into a wallet that already owns a diploma", async function () {
    const { academy, diploma, admin, professor, student, recoveryWallet } = await setupDiplomaIssued();
    const secondCareerStudent = recoveryWallet;

    await academy.connect(admin).enrollStudent(secondCareerStudent.address, CAREER_ID);
    await academy.connect(professor).submitGrade(secondCareerStudent.address, 0, 80, PROFESSOR_ID);
    await academy.connect(professor).submitGrade(secondCareerStudent.address, 1, 80, PROFESSOR_ID);
    await academy.connect(professor).submitGrade(secondCareerStudent.address, 2, 80, PROFESSOR_ID);
    await diploma.connect(admin).mintDiploma(secondCareerStudent.address, ethers.ZeroHash);

    await expect(diploma.connect(admin).burnAndReissue(student.address, secondCareerStudent.address, 1))
      .to.be.revertedWithCustomError(diploma, "NewWalletAlreadyHasDiploma")
      .withArgs(secondCareerStudent.address);
  });

  it("rejects invalid composition registration flows", async function () {
    const { registry, student, externalComposer, registrationFee } = await setupGraduate();
    const salt = ethers.encodeBytes32String("invalid-flow");

    await expect(registry.connect(student).registerComposition(IPFS_HASH, TITLE, salt))
      .to.be.revertedWith("No existe un compromiso registrado previo");

    const commit = commitHashFor(student, salt);
    await network.provider.send("evm_setAutomine", [false]);
    const commitTx = await registry.connect(student).commitComposition(commit);
    const revealTx = await registry.connect(student).registerComposition(IPFS_HASH, TITLE, salt);
    await network.provider.send("evm_mine");
    await network.provider.send("evm_setAutomine", [true]);
    await expect(commitTx.wait()).to.not.be.reverted;
    const failedRevealReceipt = await revealTx.wait().catch((error) => error.receipt);
    expect(failedRevealReceipt.status).to.equal(0);

    const paidStudentSalt = ethers.encodeBytes32String("student-paid");
    const paidStudentCommit = commitHashFor(student, paidStudentSalt);
    await registry.connect(student).commitComposition(paidStudentCommit);
    await expect(
      registry
        .connect(student)
        .registerComposition(IPFS_HASH, TITLE, paidStudentSalt, { value: 1 })
    ).to.be.revertedWith("Alumnos regulares no pagan tasa de registro");

    const externalSalt = ethers.encodeBytes32String("external-low");
    const externalCommit = commitHashFor(externalComposer, externalSalt);
    await registry.connect(externalComposer).commitComposition(externalCommit);
    await expect(
      registry
        .connect(externalComposer)
        .registerComposition(IPFS_HASH, TITLE, externalSalt, { value: registrationFee - 1n })
    ).to.be.revertedWith("Tasa de registro insuficiente para externos");
  });

  it("rejects invalid fund withdrawals", async function () {
    const { registry } = await deployFixture();

    await expect(registry.withdrawFunds(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(registry, "InvalidDestination");

    await expect(registry.withdrawFunds(ethers.Wallet.createRandom().address))
      .to.be.revertedWithCustomError(registry, "NoFundsToWithdraw");
  });
});
